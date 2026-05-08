import { useState } from 'react';
import type { QuizData, QuizQuestion } from '@/types/course';

interface QuizViewerProps {
  quizData: QuizData;
  title: string;
  onComplete?: (score: number, totalQuestions: number) => void;
}

export function QuizViewer({ quizData, title, onComplete }: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (submitted) return; // Don't allow changing answers after submission
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);
    
    // Calculate score
    const correctAnswers = quizData.questions.filter(q => 
      selectedAnswers[q.id] === q.correctAnswer
    ).length;
    
    onComplete?.(correctAnswers, totalQuestions);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  const calculateScore = () => {
    const correctAnswers = quizData.questions.filter(q => 
      selectedAnswers[q.id] === q.correctAnswer
    ).length;
    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  const isAnswerCorrect = (questionId: string) => {
    const question = quizData.questions.find(q => q.id === questionId);
    return question && selectedAnswers[questionId] === question.correctAnswer;
  };

  if (showResults) {
    const score = calculateScore();
    const correctCount = quizData.questions.filter(q => 
      selectedAnswers[q.id] === q.correctAnswer
    ).length;
    const passed = quizData.passingScore ? score >= quizData.passingScore : true;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h2>
            <div className={`text-6xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score}%
            </div>
            <p className="text-xl text-gray-700 mb-2">
              You got {correctCount} out of {totalQuestions} questions correct
            </p>
            {quizData.passingScore && (
              <p className="text-gray-600">
                Passing score: {quizData.passingScore}%
              </p>
            )}
            {passed ? (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">🎉 Congratulations! You passed!</p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">Keep trying! You can retake the quiz.</p>
              </div>
            )}
          </div>

          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Answers</h3>
            {quizData.questions.map((question, index) => {
              const selectedOptionId = selectedAnswers[question.id];
              const isCorrect = selectedOptionId === question.correctAnswer;
              const correctOption = question.options.find(opt => opt.id === question.correctAnswer);
              const selectedOption = question.options.find(opt => opt.id === selectedOptionId);

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-700">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900 mb-4">{question.question}</p>
                      
                      <div className="space-y-2 mb-4">
                        {question.options.map(option => {
                          const isSelected = option.id === selectedOptionId;
                          const isCorrectOption = option.id === question.correctAnswer;
                          
                          let bgColor = 'bg-gray-50';
                          let borderColor = 'border-gray-200';
                          let textColor = 'text-gray-700';
                          
                          if (isCorrectOption) {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-500';
                            textColor = 'text-green-900';
                          } else if (isSelected && !isCorrect) {
                            bgColor = 'bg-red-50';
                            borderColor = 'border-red-500';
                            textColor = 'text-red-900';
                          }

                          return (
                            <div
                              key={option.id}
                              className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`${textColor} font-medium`}>{option.text}</span>
                                {isCorrectOption && <span className="text-green-600">✓ Correct</span>}
                                {isSelected && !isCorrect && <span className="text-red-600">✗ Your answer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                          <p className="text-sm text-blue-800">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4">
            {quizData.allowRetake !== false && (
              <button
                onClick={handleRetake}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const hasAnswered = !!selectedAnswer;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {quizData.timeLimit && (
              <div className="text-sm text-gray-600">
                ⏱️ Time limit: {quizData.timeLimit} minutes
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
            <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-6">
            <span className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
              {currentQuestionIndex + 1}
            </span>
            <p className="text-xl font-medium text-gray-900 pt-1">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 ml-13">
            {currentQuestion.options.map(option => {
              const isSelected = selectedAnswer === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                  disabled={submitted}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {quizData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : selectedAnswers[quizData.questions[index].id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length !== totalQuestions}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                Object.keys(selectedAnswers).length === totalQuestions
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasAnswered
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          )}
        </div>

        {/* Answer count indicator */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {Object.keys(selectedAnswers).length} of {totalQuestions} questions answered
        </div>
      </div>
    </div>
  );
}
