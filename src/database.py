import sqlite3
import json
from datetime import datetime
import os

class GameDatabase:
    def __init__(self, db_path="family_feud.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Questions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                difficulty INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )
        ''')
        
        # Answers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL,
                answer_text TEXT NOT NULL,
                points INTEGER NOT NULL,
                position INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions (id)
            )
        ''')
        
        # Game sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                category_id INTEGER NOT NULL,
                team_a_name TEXT NOT NULL,
                team_b_name TEXT NOT NULL,
                team_a_score INTEGER DEFAULT 0,
                team_b_score INTEGER DEFAULT 0,
                current_question_index INTEGER DEFAULT 0,
                strikes INTEGER DEFAULT 0,
                max_strikes INTEGER DEFAULT 3,
                game_state TEXT, -- JSON blob for complex state
                status TEXT DEFAULT 'active', -- active, paused, completed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )
        ''')
        
        # Game events table (for history and analytics)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL, -- answer_revealed, score_updated, strike_added, etc.
                event_data TEXT, -- JSON blob for event details
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES game_sessions (session_id)
            )
        ''')
        
        # Users table (for authentication and roles)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'player', -- admin, host, player
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Game templates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                settings TEXT, -- JSON blob for template settings
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_connection(self):
        """Get a database connection"""
        return sqlite3.connect(self.db_path)
    
    # Category methods
    def create_category(self, name, description=None):
        """Create a new category"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO categories (name, description) VALUES (?, ?)",
                (name, description)
            )
            category_id = cursor.lastrowid
            conn.commit()
            return category_id
        except sqlite3.IntegrityError:
            return None
        finally:
            conn.close()
    
    def get_categories(self):
        """Get all categories"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description FROM categories ORDER BY name")
        categories = cursor.fetchall()
        conn.close()
        return [{"id": cat[0], "name": cat[1], "description": cat[2]} for cat in categories]
    
    def get_category_by_id(self, category_id):
        """Get category by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description FROM categories WHERE id = ?", (category_id,))
        category = cursor.fetchone()
        conn.close()
        if category:
            return {"id": category[0], "name": category[1], "description": category[2]}
        return None
    
    # Question methods
    def create_question(self, category_id, question_text, answers, difficulty=1):
        """Create a new question with answers"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            # Insert question
            cursor.execute(
                "INSERT INTO questions (category_id, question_text, difficulty) VALUES (?, ?, ?)",
                (category_id, question_text, difficulty)
            )
            question_id = cursor.lastrowid
            
            # Insert answers
            for i, answer in enumerate(answers):
                cursor.execute(
                    "INSERT INTO answers (question_id, answer_text, points, position) VALUES (?, ?, ?, ?)",
                    (question_id, answer['text'], answer['points'], i + 1)
                )
            
            conn.commit()
            return question_id
        except Exception as e:
            conn.rollback()
            print(f"Error creating question: {e}")
            return None
        finally:
            conn.close()
    
    def get_questions_by_category(self, category_id):
        """Get all questions for a category with their answers"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get questions
        cursor.execute(
            "SELECT id, question_text, difficulty FROM questions WHERE category_id = ? ORDER BY id",
            (category_id,)
        )
        questions = cursor.fetchall()
        
        result = []
        for question in questions:
            question_id, question_text, difficulty = question
            
            # Get answers for this question
            cursor.execute(
                "SELECT answer_text, points FROM answers WHERE question_id = ? ORDER BY position",
                (question_id,)
            )
            answers = cursor.fetchall()
            
            result.append({
                "id": question_id,
                "question": question_text,
                "difficulty": difficulty,
                "answers": [{"text": ans[0], "points": ans[1], "revealed": False} for ans in answers]
            })
        
        conn.close()
        return result
    
    # Game session methods
    def create_game_session(self, session_id, category_id, team_a_name, team_b_name):
        """Create a new game session"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO game_sessions 
                (session_id, category_id, team_a_name, team_b_name, game_state) 
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, category_id, team_a_name, team_b_name, '{}'))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating game session: {e}")
            return False
        finally:
            conn.close()
    
    def update_game_session(self, session_id, **kwargs):
        """Update game session data"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Build dynamic update query
        set_clauses = []
        values = []
        
        for key, value in kwargs.items():
            if key in ['team_a_score', 'team_b_score', 'current_question_index', 'strikes', 'status']:
                set_clauses.append(f"{key} = ?")
                values.append(value)
            elif key == 'game_state':
                set_clauses.append("game_state = ?")
                values.append(json.dumps(value) if isinstance(value, dict) else value)
        
        if not set_clauses:
            return False
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        values.append(session_id)
        
        query = f"UPDATE game_sessions SET {', '.join(set_clauses)} WHERE session_id = ?"
        
        try:
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating game session: {e}")
            return False
        finally:
            conn.close()
    
    def get_game_session(self, session_id):
        """Get game session by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT session_id, category_id, team_a_name, team_b_name, 
                   team_a_score, team_b_score, current_question_index, 
                   strikes, max_strikes, game_state, status, created_at
            FROM game_sessions WHERE session_id = ?
        ''', (session_id,))
        
        session = cursor.fetchone()
        conn.close()
        
        if session:
            return {
                "session_id": session[0],
                "category_id": session[1],
                "team_a_name": session[2],
                "team_b_name": session[3],
                "team_a_score": session[4],
                "team_b_score": session[5],
                "current_question_index": session[6],
                "strikes": session[7],
                "max_strikes": session[8],
                "game_state": json.loads(session[9]) if session[9] else {},
                "status": session[10],
                "created_at": session[11]
            }
        return None
    
    def log_game_event(self, session_id, event_type, event_data=None):
        """Log a game event for history and analytics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO game_events (session_id, event_type, event_data) VALUES (?, ?, ?)",
                (session_id, event_type, json.dumps(event_data) if event_data else None)
            )
            conn.commit()
            return True
        except Exception as e:
            print(f"Error logging game event: {e}")
            return False
        finally:
            conn.close()
    
    def get_game_history(self, session_id):
        """Get game event history for a session"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT event_type, event_data, timestamp 
            FROM game_events 
            WHERE session_id = ? 
            ORDER BY timestamp
        ''', (session_id,))
        
        events = cursor.fetchall()
        conn.close()
        
        return [{
            "event_type": event[0],
            "event_data": json.loads(event[1]) if event[1] else None,
            "timestamp": event[2]
        } for event in events]
    
    # Import data from CSV (for migration)
    def import_csv_data(self, csv_data):
        """Import questions from CSV data"""
        categories_map = {}
        
        for row in csv_data:
            category_name = row.get("Category")
            if not category_name:
                continue
            
            # Create category if it doesn't exist
            if category_name not in categories_map:
                category_id = self.create_category(category_name)
                if category_id:
                    categories_map[category_name] = category_id
                else:
                    # Category already exists, get its ID
                    categories = self.get_categories()
                    for cat in categories:
                        if cat["name"] == category_name:
                            categories_map[category_name] = cat["id"]
                            break
            
            category_id = categories_map.get(category_name)
            if not category_id:
                continue
            
            # Prepare answers
            answers = []
            for i in range(1, 9):  # Up to 8 answers
                answer_text = row.get(f"Answer{i}")
                points = row.get(f"Score{i}")
                if answer_text and points:
                    try:
                        answers.append({
                            "text": answer_text.strip(),
                            "points": int(points)
                        })
                    except ValueError:
                        continue
            
            if answers:
                question_text = row.get("Question", "").strip()
                if question_text:
                    self.create_question(category_id, question_text, answers)
    
    def close(self):
        """Close database connection (cleanup)"""
        pass  # SQLite connections are closed after each operation

# Initialize database instance
db = GameDatabase()

