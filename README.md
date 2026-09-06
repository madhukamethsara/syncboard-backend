# SyncBoard Backend API

SyncBoard is a collaborative task-planning application. This backend provides secure user authentication, teams, invitations, personal and team boards, board columns, tasks, comments, and notifications.

## Tech stack

- Node.js and Express.js
- MongoDB and Mongoose
- JWT authentication with HTTP-only cookies
- Argon2 password hashing
- Zod request validation
- Nodemailer for optional email verification and team invitations

## Prerequisites

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string

## Installation

```bash
git clone <your-backend-repository-url>
cd syncboard-backend
npm install
```

Create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syncboard
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

EMAIL_VERIFICATION_REQUIRED=false
EMAIL_USER=
EMAIL_APP_PASSWORD=
```

Start the development server:

```bash
npm run dev
```

The API will run at `http://localhost:5000`.

## Authentication

After a successful login, the backend sets a JWT in an HTTP-only cookie called `token`. Every protected endpoint uses this cookie automatically when requests are sent from the same client.

For Postman testing, run **Login** first. Postman will store and resend the localhost cookie.

## API reference

Base URL: `http://localhost:5000`

All routes except health check, register, login, and email verification require authentication.

### Health

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | Confirm the backend is running. |

### Authentication

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Register a new user. | `name`, `email`, `password` |
| POST | `/api/auth/login` | Log in and set the `token` cookie. | `email`, `password` |
| POST | `/api/auth/logout` | Clear the authentication cookie. | None |
| GET | `/api/auth/me` | Get the currently logged-in user. | None |
| GET | `/api/auth/verify-email/:token` | Verify a user's email address. | Token in URL |

Example registration request:

```json
{
  "name": "Madhuka Methsara",
  "email": "madhuka@example.com",
  "password": "Password123"
}
```

### User profile

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| GET | `/api/users/me` | Get the logged-in user's profile. | None |
| PATCH | `/api/users/me` | Update profile information. | `name` and/or `avatar` |
| PATCH | `/api/users/me/password` | Change the password. | `currentPassword`, `newPassword`, `confirmPassword` |

### Teams

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| POST | `/api/teams` | Create a team. | `name` |
| GET | `/api/teams` | Get all teams for the logged-in user. | None |
| GET | `/api/teams/:teamId` | Get one accessible team. | None |
| PATCH | `/api/teams/:teamId` | Update a team name. Owner only. | `name` |
| DELETE | `/api/teams/:teamId` | Delete a team and its related boards, columns, tasks, and invitations. Owner only. | None |
| GET | `/api/teams/:teamId/members` | Get team members. | None |
| PATCH | `/api/teams/:teamId/members/:userId/role` | Change a member's role. Owner only. | `role` (`admin` or `member`) |

### Team invitations

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| POST | `/api/teams/:teamId/invitations` | Invite a user to a team. Owner/admin only. | `email`, optional `role` |
| GET | `/api/teams/:teamId/invitations` | Get pending team invitations. Owner/admin only. | None |
| POST | `/api/invitations/:token/accept` | Accept a team invitation. Login email must match the invitation email. | None |

### Boards

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| POST | `/api/boards` | Create a personal or team board. It automatically creates **To Do**, **In Progress**, and **Done** columns. | `name`, optional `description`, optional `teamId` |
| GET | `/api/boards` | Get personal boards and accessible team boards. | None |
| GET | `/api/boards/:boardId` | Get a single accessible board. | None |
| PATCH | `/api/boards/:boardId` | Update a board. Board owner or team admin only. | `name` and/or `description` |
| DELETE | `/api/boards/:boardId` | Delete a board with its columns and tasks. Board owner or team admin only. | None |

Example personal board request:

```json
{
  "name": "Assignment Board",
  "description": "Planning for Assignment 02",
  "teamId": null
}
```

### Columns

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| GET | `/api/columns/board/:boardId` | Get board columns in position order. | None |
| POST | `/api/columns` | Create a board column. | `name`, `boardId` |
| PATCH | `/api/columns/:columnId` | Rename or reposition a column. | `name` and/or `position` |
| DELETE | `/api/columns/:columnId` | Delete a column. Fails when it still contains tasks. | None |

### Tasks and comments

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| POST | `/api/tasks` | Create a task in a board column. | `title`, `boardId`, `columnId`, plus optional fields below |
| GET | `/api/tasks/board/:boardId` | Get all accessible tasks for a board. | None |
| PATCH | `/api/tasks/:taskId` | Update a task or move it to another column. | Any valid task field |
| DELETE | `/api/tasks/:taskId` | Delete a task. | None |
| POST | `/api/tasks/:taskId/comments` | Add a comment to a task. | `text` |

Supported optional task fields:

- `description` - up to 1,000 characters
- `assignedTo` - a board member's user ID, or `null`
- `priority` - `low`, `medium`, or `high`
- `dueDate` - a valid date string or `null`
- `labels` - array of up to 10 labels
- `attachments` - array of valid URLs
- `position` - non-negative integer
- `columnId` - use this in update requests to move a task

Example task request:

```json
{
  "title": "Create Postman collection",
  "description": "Document every SyncBoard endpoint",
  "boardId": "BOARD_ID",
  "columnId": "COLUMN_ID",
  "assignedTo": null,
  "priority": "high",
  "dueDate": "2026-09-15",
  "labels": ["documentation"],
  "attachments": []
}
```

### Notifications

| Method | Route | Description | Request body |
| --- | --- | --- | --- |
| GET | `/api/notifications` | Get up to 100 notifications, newest first. | None |
| PATCH | `/api/notifications/:notificationId/read` | Mark one notification as read. | None |
| PATCH | `/api/notifications/read-all` | Mark every unread notification as read. | None |

Notifications are created when a user is invited to a team or assigned to a task.

## Validation and permissions

- User names require 2-50 characters; passwords require at least 8 characters.
- Board names require 2-100 characters; column names require 1-100 characters.
- A task assignee must belong to the board's team.
- Personal boards are controlled by their creator.
- Team owners can manage teams and member roles; team admins can invite members and manage team boards.

## Postman collection

Import `SyncBoard_API_Collection.postman_collection.json` into Postman to test all routes. The collection contains **37 requests** and automatically saves created IDs such as `teamId`, `boardId`, `columnId`, and `taskId` for later requests.

## Suggested testing order

1. Run **Health Check**.
2. Register an account, then log in.
3. Create a personal board or a team.
4. Get the board columns.
5. Create and update a task, then add a comment.
6. Test notifications after assigning a task to another team member.
7. Use delete endpoints last, as they remove database records.

## License

This project is created for academic and learning purposes.
