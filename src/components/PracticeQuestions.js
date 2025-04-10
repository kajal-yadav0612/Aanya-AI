import React, { useState } from 'react';
import './PracticeQuestions.css';

function PracticeQuestions() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);

  const subjectTopics = {
    Mathematics: ['Algebra', 'Geometry', 'Calculus', 'Trigonometry', 'Statistics', 'Probability'],
    Science: ['Physics', 'Chemistry', 'Biology', 'Environmental Science', 'Astronomy'],
    English: ['Grammar', 'Literature', 'Vocabulary', 'Writing Skills', 'Reading Comprehension'],
    'Computer Science': ['Programming Basics', 'Data Structures', 'Algorithms', 'Databases', 'Networking', 'Cybersecurity'],
    'Social Studies': ['Civics', 'World Politics', 'Cultural Studies', 'Globalization'],
    History: ['Ancient History', 'Modern History', 'World Wars', 'Indian Freedom Struggle', 'Medieval History'],
    Geography: ['Physical Geography', 'Human Geography', 'World Geography', 'Maps and Diagrams'],
    Economics: ['Microeconomics', 'Macroeconomics', 'Banking & Finance', 'International Trade', 'Economic Policies']
  };

  const handleSubjectChange = (e) => {
    const selected = e.target.value;
    setSubject(selected);
    setTopic('');
  };

  const handleLaunch = async () => {
    if (!subject || !topic || !numQuestions) {
      setError('Please select all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/questions/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, numQuestions }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();
      if (data.questions) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowAnswer(false);
        setExplanation('');
      } else {
        throw new Error('No questions returned.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExplanation = async (questionText, answer) => {
    try {
      setExplanationLoading(true);
      const res = await fetch('http://localhost:8000/api/questions/get-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, answer }),
      });
      const data = await res.json();
      setExplanation(data.explanation || 'Explanation not available.');
    } catch (err) {
      console.error('Error fetching explanation:', err);
      setExplanation('Failed to load explanation.');
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleOptionClick = (option) => {
    if (!showAnswer) {
      setSelectedOption(option);
      setShowAnswer(true);
      fetchExplanation(currentQuestion.question, currentQuestion.answer);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowAnswer(false);
    setExplanation('');
  };

  const currentQuestion = questions[currentIndex];

  const formatExplanation = (text) => {
    return text
      .split('. ')
      .filter((sentence) => sentence.trim() !== '')
      .map((sentence, index) => (
        <li key={index} className="text-sm text-gray-700 mb-1">
          {sentence.trim().replace(/\.$/, '.')}
        </li>
      ));
  };

  return (
    <div className="practice-container">
      <div className="practice-content">
        <div className="practice-form">
          {!questions.length && (
            <>
              {/* Selection Fields */}
              <div className="form-group">
                <div className="select-wrapper">
                  <select value={subject} onChange={handleSubjectChange} className="form-select">
                    <option value="" disabled>Subject</option>
                    {Object.keys(subjectTopics).map((subj, index) => (
                      <option key={index} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="form-select"
                    disabled={!subject}
                  >
                    <option value="" disabled>Topics</option>
                    {subject && subjectTopics[subject].map((t, index) => (
                      <option key={index} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                    className="form-select"
                  >
                    <option value="" disabled>Number of Questions</option>
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="15">15 Questions</option>
                    <option value="20">20 Questions</option>
                  </select>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="launch-button" onClick={handleLaunch} disabled={loading}>
                  {loading ? 'Loading...' : 'Start Practice'}
                </button>
              </div>
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          {questions.length > 0 && currentQuestion && (
            <div className="question-card scrollable">
              <p><strong>Q{currentIndex + 1}:</strong> {currentQuestion.question}</p>
              <ul className="options-list">
                {currentQuestion.options.map((opt, i) => {
                  const isCorrect = opt === currentQuestion.answer;
                  const isSelected = opt === selectedOption;

                  let className = 'option';
                  if (showAnswer) {
                    if (isSelected && isCorrect) className += ' correct';
                    else if (isSelected && !isCorrect) className += ' incorrect';
                    else if (isCorrect) className += ' correct';
                  }

                  return (
                    <li
                      key={i}
                      className={className}
                      onClick={() => handleOptionClick(opt)}
                    >
                      {opt}
                      {showAnswer && isSelected && isCorrect && <span> ✅</span>}
                      {showAnswer && isSelected && !isCorrect && <span> ❌</span>}
                      {showAnswer && !isSelected && isCorrect && <span> ✅</span>}
                    </li>
                  );
                })}
              </ul>

              {showAnswer && (
                <div className="explanation-section">
                  <h4>{selectedOption === currentQuestion.answer ? '✅ Your answer is correct!' : '❌ Your answer is incorrect!'}</h4>
                  {explanationLoading ? (
                    <p>Loading explanation...</p>
                  ) : (
                    <div className="explanation-box">
                      <ul className="list-disc pl-5">{formatExplanation(explanation)}</ul>
                    </div>
                  )}
                </div>
              )}

              {showAnswer && currentIndex < questions.length - 1 && (
                <button className="launch-button" onClick={handleNext}>Next</button>
              )}

              {showAnswer && currentIndex === questions.length - 1 && (
                <p className="completion-message">You’ve completed the practice session!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PracticeQuestions;
