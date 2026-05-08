'use client';

import { useState } from 'react';
import { Input, Textarea } from '@/components/ui';
import type { QuizData, QuizQuestion, QuizOption } from '@/types/course';

interface QuizCreatorProps {
  onComplete: (quizData: QuizData, title: string) => void;
  onCancel: () => void;
  initialData?: QuizData;
  initialTitle?: string;
}

export function QuizCreator({ onComplete, onCancel, initialData, initialTitle }: QuizCreatorProps) {
  const [title, setTitle] = useState(initialTitle || '');
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialData?.questions || [
      {
        id: `q_${Date.now()}`,
        question: '',
        options: [
          { id: `opt_${Date.now()}_1`, text: '' },
          { id: `opt_${Date.now()}_2`, text: '' },
        ],
        correctAnswer: '',
        explanation: '',
        points: 1,
      },
    ]
  );
  const [passingScore, setPassingScore] = useState(initialData?.passingScore || 70);
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 0);
  const [allowRetake, setAllowRetake] = useState(initialData?.allowRetake ?? true);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      options: [
        { id: `opt_${Date.now()}_1`, text: '' },
        { id: `opt_${Date.now()}_2`, text: '' },
      ],
      correctAnswer: '',
      explanation: '',
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionIndex: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== questionIndex));
    }
  };

  const updateQuestion = (questionIndex: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[questionIndex] = { ...updated[questionIndex], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    const newOption: QuizOption = {
      id: `opt_${Date.now()}`,
      text: '',
    };
    updated[questionIndex].options.push(newOption);
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
      setQuestions(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex].text = text;
    setQuestions(updated);
  };

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty`);
        return;
      }
      if (q.options.some(opt => !opt.text.trim())) {
        alert(`Question ${i + 1} has empty options`);
        return;
      }
      if (!q.correctAnswer) {
        alert(`Question ${i + 1} has no correct answer selected`);
        return;
      }
    }

    const quizData: QuizData = {
      questions,
      passingScore,
      timeLimit: timeLimit > 0 ? timeLimit : undefined,
      allowRetake,
    };

    onComplete(quizData, title);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Quiz</h2>
          
          {/* Quiz Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Module 1 Assessment"
              className="w-full"
            />
          </div>

          {/* Quiz Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <Input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes, 0 = no limit)
              </label>
              <Input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow Retake
              </label>
              <select
                value={allowRetake ? 'yes' : 'no'}
                onChange={(e) => setAllowRetake(e.target.value === 'yes')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Questions */}
          {questions.map((question, qIndex) => (
            <div key={question.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove Question
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question here..."
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                {question.options.map((option, oIndex) => (
                  <div key={option.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={question.correctAnswer === option.id}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', option.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1"
                    />
                    {question.options.length > 2 && (
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addOption(qIndex)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  + Add Option
                </button>
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation (optional)
                </label>
                <Textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explain why this is the correct answer..."
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                <Input
                  type="number"
                  value={question.points || 1}
                  onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-32"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            + Add Question
          </button>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Save Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
