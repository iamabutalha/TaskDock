require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, withTransaction } = require("../config/db.js");

const PASSWORD = "Test@1234";
const DAY = 86400000;
const COLUMNS = ["Todo", "In Progress", "Review", "Done"];

const USERS = [
  { key: "alex", name: "Alex Morgan", email: "alex@example.com" },
  { key: "maya", name: "Maya Tena", email: "maya@example.com" },
  { key: "priya", name: "Priya Sundari", email: "priya@example.com" },
  { key: "sam", name: "sam warik", email: "sam@example.com" },
  { key: "leena", name: "leena henry", email: "leena@example.com" },
  { key: "Jhon", name: "Jhon Doe", email: "john@example.com" },
];

const BOARDS = [
  {
    title: "Product RoadMap",
    description: "RoadMap for product development",
    owner: "alex",
    color: "#2f8159",
    members: ["maya", "sam", "priya"],
    updatedDaysAgo: 0.3,
    tasks: [
      "Define Q3 OKRS",
      "PRioritize feature backlog",
      "User Interview synthesis",
      "Pricing experiment plans",
      "Competitor anaysis",
      "RoadMap Review with leadership",
      "Define success metrics",
      "Launch MVP to beta users",
      "Customer interview script",
      "Stack holders alingment",
      "Feature flag rollout plan",
      "update public roadmap",
    ],
  },
  {
    title: "Engineering Sprint",
    description: "Plan and deliver the current engineering sprint",
    owner: "alex",
    color: "#2563eb",
    members: ["maya", "priya", "sam"],
    updatedDaysAgo: 1,
    tasks: [
      "Refine sprint backlog",
      "Implement authentication",
      "Review pull requests",
      "Deploy staging build",
    ],
  },
  {
    title: "Marketing Launch",
    description: "Coordinate the product launch campaign",
    owner: "alex",
    color: "#db2777",
    members: ["maya", "leena"],
    updatedDaysAgo: 2,
    tasks: [
      "Draft launch messaging",
      "Prepare social assets",
      "Schedule email campaign",
      "Measure launch results",
    ],
  },
  {
    title: "Customer Research",
    description: "Track customer interviews and research findings",
    owner: "alex",
    color: "#7c3aed",
    members: ["priya", "sam"],
    updatedDaysAgo: 3,
    tasks: [
      "Recruit interview participants",
      "Conduct user interviews",
      "Synthesize findings",
      "Share research report",
    ],
  },
  {
    title: "Website Redesign",
    description: "Refresh the public website experience",
    owner: "alex",
    color: "#ea580c",
    members: ["maya", "leena", "Jhon"],
    updatedDaysAgo: 4,
    tasks: [
      "Audit current pages",
      "Create wireframes",
      "Build responsive components",
      "Publish redesigned site",
    ],
  },
  {
    title: "Quarterly Goals",
    description: "Set and monitor company objectives for the quarter",
    owner: "alex",
    color: "#16a34a",
    members: ["maya", "priya", "leena"],
    updatedDaysAgo: 6,
    tasks: [
      "Set quarterly objectives",
      "Define key results",
      "Assign goal owners",
      "Run progress review",
    ],
  },
  {
    title: "Design System",
    description: "Maya's design-system improvements, shared with Alex",
    owner: "maya",
    color: "#9333ea",
    members: ["alex", "leena", "Jhon"],
    updatedDaysAgo: 1.5,
    tasks: [
      "Inventory UI patterns",
      "Define color tokens",
      "Create component library",
      "Document usage guidelines",
    ],
  },
  {
    title: "Data Insights",
    description: "Priya's analytics initiative, shared with Alex",
    owner: "priya",
    color: "#ca8a04",
    members: ["alex", "sam"],
    updatedDaysAgo: 2.5,
    tasks: [
      "Collect reporting requirements",
      "Create analytics dashboard",
      "Validate data sources",
      "Present insights",
    ],
  },
];

const COL_CYCLE = [0, 1, 1, 2, 3, 0, 2, 3, 1, 3, 0, 1];

const PRIO_CYCLE = [
  "medium",
  "high",
  "low",
  "urgent",
  "medium",
  "high",
  "low",
  "urgent",
];
const DUE_CYCLE = [
  -9,
  2,
  null,
  5,
  -2,
  14,
  1,
  null,
  20,
  -4,
  6,
  9,
  3,
  null,
  12,
  -1,
  7,
];

const run = async () => {
  await withTransaction(async (c) => {
    await c.query("DELETE FROM users WHERE email = ANY($1)", [
      USERS.map((u) => u.email.toLowerCase()),
    ]);

    const hash = await bcrypt.hash(PASSWORD, 10);
    const uid = {};
    for (const u of USERS) {
      const { rows } = await c.query(
        `INSERT INTO users (name, email, password_hash, created_at)
         VALUES ($1, $2, $3, now() - interval '60 days') RETURNING id`,
        [u.name, u.email.toLowerCase(), hash],
      );
      uid[u.key] = rows[0].id;
    }

    let taskTotal = 0;

    for (const b of BOARDS) {
      const ownerId = uid[b.owner];
      const updatedAt = new Date(Date.now() - b.updatedDaysAgo * DAY);

      const { rows: br } = await c.query(
        `INSERT INTO boards (title, description, color, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now() - interval '45 days', $5) RETURNING id`,
        [b.title, b.description, b.color, ownerId, updatedAt],
      );
      const boardId = br[0].id;

      let memberKeys = [b.owner, ...b.members];
      if (!memberKeys.includes("alex")) memberKeys.push("alex");
      memberKeys = [...new Set(memberKeys)];

      for (let mi = 0; mi < memberKeys.length; mi += 1) {
        const mk = memberKeys[mi];
        const role = mk === b.owner ? "owner" : mi === 1 ? "admin" : "member";
        await c.query(
          `INSERT INTO board_members (board_id, user_id, role)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [boardId, uid[mk], role],
        );
      }

      const colIds = [];
      for (let i = 0; i < COLUMNS.length; i += 1) {
        const { rows: cr } = await c.query(
          `INSERT INTO columns (board_id, title, position)
           VALUES ($1, $2, $3) RETURNING id`,
          [boardId, COLUMNS[i], (i + 1) * 1000],
        );
        colIds.push(cr[0].id);
      }

      const assigneePool = ["alex", "alex", ...memberKeys];
      for (let i = 0; i < b.tasks.length; i += 1) {
        const colIdx = COL_CYCLE[i % COL_CYCLE.length];
        const priority = PRIO_CYCLE[(i + b.title.length) % PRIO_CYCLE.length];
        const offset = DUE_CYCLE[(i + b.title.length) % DUE_CYCLE.length];
        const dueDate =
          offset === null ? null : new Date(Date.now() + offset * DAY);
        const assigneeKey =
          i % 5 === 4 ? null : assigneePool[i % assigneePool.length];
        const assigneeId = assigneeKey ? uid[assigneeKey] : null;

        await c.query(
          `INSERT INTO tasks
            (board_id, column_id, title, description, priority, due_date, assignee_id, position, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() - interval '20 days', $10)`,
          [
            boardId,
            colIds[colIdx],
            b.tasks[i],
            i % 3 === 0
              ? `${b.tasks[i]} � details and acceptance criteria.`
              : null,
            priority,
            dueDate,
            assigneeId,
            (i + 1) * 1000,
            ownerId,
            updatedAt,
          ],
        );
        taskTotal += 1;
      }

      const ownerName = USERS.find((u) => u.key === b.owner).name;
      const acts = [
        { action: "board.created", message: `${ownerName} created the board` },
        {
          action: "task.created",
          message: `${ownerName} added "${b.tasks[0]}"`,
        },
        {
          action: "task.moved",
          message: `${USERS.find((u) => u.key === memberKeys[1] || u.key === b.owner)?.name || ownerName} moved "${b.tasks[Math.min(3, b.tasks.length - 1)]}" to Done`,
        },
      ];
      for (let ai = 0; ai < acts.length; ai += 1) {
        await c.query(
          `INSERT INTO activities (board_id, user_id, action, message, created_at)
           VALUES ($1, $2, $3, $4, now() - ($5 || ' hours')::interval)`,
          [boardId, ownerId, acts[ai].action, acts[ai].message, (ai + 1) * 7],
        );
      }
    }

    return taskTotal;
  }).then((taskTotal) => {
    console.log("? Demo workspace seeded.");
    console.log(
      `   Users: ${USERS.length} � Boards: ${BOARDS.length} � Tasks: ${taskTotal}`,
    );
    console.log(`   Login: alex@example.com / ${PASSWORD}`);
    console.log("   (teammates share the same password)");
  });
};

run()
  .catch((err) => {
    console.error("? Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
