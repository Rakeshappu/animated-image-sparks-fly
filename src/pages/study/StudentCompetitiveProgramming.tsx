
import React from 'react';
import { ExternalLink, Code, BookOpen, CheckCircle, Award, TrendingUp } from 'lucide-react';

interface PlatformProps {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  features: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  color: string;
}

const platforms: PlatformProps[] = [
  {
    name: 'LeetCode',
    description: 'A platform to help you enhance your skills, expand your knowledge and prepare for technical interviews.',
    url: 'https://leetcode.com',
    icon: <Code />,
    features: ['Company-specific problems', 'Weekly contests', 'Detailed solutions', 'Discussion forums'],
    difficulty: 'All Levels',
    color: 'bg-yellow-500'
  },
  {
    name: 'HackerRank',
    description: 'Practice coding challenges, prepare for interviews, and get hired.',
    url: 'https://www.hackerrank.com',
    icon: <BookOpen />,
    features: ['Skill certification', 'Interview preparation kit', 'Domain-specific challenges'],
    difficulty: 'Beginner',
    color: 'bg-green-500'
  },
  {
    name: 'CodeForces',
    description: 'Russian competitive programming website that regularly holds contests.',
    url: 'https://codeforces.com',
    icon: <Award />,
    features: ['Regular contests', 'Global rating system', 'Challenging problems', 'Active community'],
    difficulty: 'Advanced',
    color: 'bg-red-500'
  },
  {
    name: 'AtCoder',
    description: 'Japanese programming contest website for anyone from beginners to experts.',
    url: 'https://atcoder.jp',
    icon: <TrendingUp />,
    features: ['Weekly contests', 'Quality problems', 'Rating system', 'Educational content'],
    difficulty: 'Intermediate',
    color: 'bg-blue-500'
  },
  {
    name: 'GeeksforGeeks',
    description: 'A computer science portal for geeks with well-written, well-explained computer science articles.',
    url: 'https://practice.geeksforgeeks.org',
    icon: <CheckCircle />,
    features: ['Article-based learning', 'Company preparation', 'Interview experiences', 'DSA content'],
    difficulty: 'All Levels',
    color: 'bg-emerald-500'
  }
];

export const StudentCompetitiveProgramming = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Competitive Programming Resources</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Enhance your problem-solving skills and prepare for technical interviews with these top coding platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div 
            key={platform.name}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className={`${platform.color} p-4 flex items-center`}>
              <div className="bg-white rounded-full p-2 mr-3">
                <span className="text-gray-800">
                  {platform.icon}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{platform.name}</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">{platform.description}</p>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Features:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {platform.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  platform.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  platform.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  platform.difficulty === 'Advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {platform.difficulty}
                </span>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <span className="mr-1 text-sm">Visit</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Getting Started Tips</h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span className="text-gray-700 dark:text-gray-300">Start with easy problems and gradually increase difficulty</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span className="text-gray-700 dark:text-gray-300">Practice consistently, even if it's just 1-2 problems per day</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span className="text-gray-700 dark:text-gray-300">Learn the common data structures and algorithms</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span className="text-gray-700 dark:text-gray-300">Review solutions after solving problems to learn better approaches</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span className="text-gray-700 dark:text-gray-300">Participate in contests to improve problem-solving speed</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentCompetitiveProgramming;
