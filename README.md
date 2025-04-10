### 1️⃣ Clone the Repository

git clone https://github.com/kajal-yadav0612/Aanya-AI.git
cd Aanya-AI

cd backend
python -m venv venv
# For Windows:
venv\Scripts\activate
# For Mac/Linux:
source venv/bin/activate

pip install fastapi uvicorn httpx python-dotenv
Create a .env file in the backend/ folder with:
GEMINI_API_KEY=your_gemini_api_key_here

▶️ Run the backend server:
uvicorn main:app --reload

▶️ Frontend Setup (React)
cd ../frontend
npm install
npm start


