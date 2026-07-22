const express = require("express");
const { requireAuth } = require("../middleware/auth.js");
const { requireBoardAccess } = require("../middleware/boardAccess.js");
const board = require("../controllers/boardController.js");
const columns = require("../controllers/columnController.js");
const tasks = require("../controllers/taskController.js");
const ai = require("../controllers/aiController.js");

const router = express.Router();

router.use(requireAuth);
router.get("/", board.listBoards);
router.post("/", board.createBoard);

router.get("/:boardId", requireBoardAccess, board.getBoard);
router.put("/:boardId", requireBoardAccess, board.updateBoard);
router.delete("/:boardId", requireBoardAccess, board.deleteBoard);

router.get("/:boardId/activity", requireBoardAccess, board.getActivity);
router.post("/:boardId/members", requireBoardAccess, board.addMember);
router.delete(
  "/:boardId/members/:userId",
  requireBoardAccess,
  board.removeMember,
);

router.post("/:boardId/columns", requireBoardAccess, columns.createColumn);
router.patch(
  "/:boardId/columns/:columnId",
  requireBoardAccess,
  columns.updateColumn,
);

router.delete(
  "/:boardId/columns/:columnId",
  requireBoardAccess,
  columns.deleteColumn,
);

router.get(":/boardId/tasks", requireBoardAccess, tasks.listTasks);
router.post(":/boardId/tasks", requireBoardAccess, tasks.createTask);
router.patch(":/boardId/tasks/:taskId", requireBoardAccess, tasks.createTask);
router.patch(
  ":/boardId/tasks/:taskId/move",
  requireBoardAccess,
  tasks.moveTask,
);
router.delete(":/boardId/tasks/:taskId", requireBoardAccess, tasks.createTask);

router.post(
  "/:boardId/ai/generate-tasks",
  requireBoardAccess,
  ai.generateTasks,
);

router.post("/:boardId/ai/breakdown", requireBoardAccess, ai.breakdownTask);
router.post("/:boardId/ai/summary", requireBoardAccess, ai.summarizeBoard);

module.exports = router;
