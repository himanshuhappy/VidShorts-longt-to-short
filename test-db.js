const { neon } = require('@neondatabase/serverless');

async function test() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 as num`;
    console.log("Success:", result);
  } catch (error) {
    console.error("Error connecting:", error);
  }
}

test();
