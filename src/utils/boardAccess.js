const mongoose = require("mongoose");

const sameId = (left, right) => left && right && left.toString() === right.toString();
const isValidId = (id) => mongoose.isValidObjectId(id);

function getBoardPermission(board, userId) {
  if (!board.team) {
    const isCreator = sameId(board.createdBy?._id || board.createdBy, userId);
    return { canView: isCreator, canEdit: isCreator, canDelete: isCreator };
  }

  const team = board.team;
  const isOwner = sameId(team.owner?._id || team.owner, userId);
  const member = team.members?.find((item) => sameId(item.user?._id || item.user, userId));
  return {
    canView: Boolean(isOwner || member),
    canEdit: Boolean(isOwner || member),
    canDelete: Boolean(isOwner || member?.role === "owner" || member?.role === "admin"),
  };
}

function isBoardAssignee(board, userId) {
  if (!userId) return true;
  if (!board.team) return sameId(board.createdBy?._id || board.createdBy, userId);
  const team = board.team;
  return sameId(team.owner?._id || team.owner, userId) || team.members?.some((member) => sameId(member.user?._id || member.user, userId));
}

module.exports = { sameId, isValidId, getBoardPermission, isBoardAssignee };
