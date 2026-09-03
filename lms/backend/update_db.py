import sqlite3

# Update the database name/path if yours is named differently (e.g., app.db, test.db, or sql_app.db)
db_path = "lms.db" 

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # 1. Add missing 'code' column to courses table
    cursor.execute("ALTER TABLE courses ADD COLUMN code VARCHAR DEFAULT 'A1B2C3';")
    print("Added 'code' column to courses table.")
except sqlite3.OperationalError as e:
    print("Column 'code' already exists or error:", e)

# 2. Create missing enrollments table
cursor.execute("""
CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR NOT NULL REFERENCES users(id),
    course_id VARCHAR NOT NULL REFERENCES courses(id),
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
""")
print("Ensured 'enrollments' table exists.")

conn.commit()
conn.close()
print("Database schema update complete!")