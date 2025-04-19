
import React, { useState } from 'react';
import { Code, Award, TrendingUp, Trophy, ExternalLink, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Define platform types
interface Platform {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: JSX.Element;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  color: string;
  topics: string[];
}

// Add platforms with their details
const platforms: Platform[] = [
  {
    id: 'leetcode',
    name: 'LeetCode',
    description: 'The most popular platform for technical interviews with thousands of problems across different topics like data structures, algorithms, and design patterns.',
    url: 'https://leetcode.com',
    icon: <Code className="h-10 w-10 text-yellow-500" />,
    difficulty: 'intermediate',
    color: 'bg-yellow-500',
    topics: ['Data Structures', 'Algorithms', 'Database', 'Design']
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    description: 'Great for beginners with tutorials and practice problems in multiple domains including algorithms, data structures, and language proficiency.',
    url: 'https://www.hackerrank.com',
    icon: <TrendingUp className="h-10 w-10 text-green-500" />,
    difficulty: 'beginner',
    color: 'bg-green-500',
    topics: ['Algorithms', 'Data Structures', 'Mathematics', 'SQL']
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    description: 'Popular for competitive programming contests with regular competitions and extensive problem archives at various difficulty levels.',
    url: 'https://codeforces.com',
    icon: <Trophy className="h-10 w-10 text-red-500" />,
    difficulty: 'advanced',
    color: 'bg-red-500',
    topics: ['Competitive Programming', 'Algorithms', 'Data Structures', 'Mathematics']
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    description: 'Japanese competitive programming platform with high-quality problems and regular contests for all skill levels.',
    url: 'https://atcoder.jp',
    icon: <Award className="h-10 w-10 text-blue-500" />,
    difficulty: 'intermediate',
    color: 'bg-blue-500',
    topics: ['Competitive Programming', 'Algorithms', 'Problem Solving']
  }
];

const StudentCompetitiveProgramming = () => {
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Code className="mr-2 h-6 w-6 text-indigo-600" />
          Competitive Programming Resources
        </h1>
        <p className="mt-1 text-gray-600">
          Curated resources to help you excel in competitive programming and technical interviews
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <section className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Popular Platforms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <motion.div
                  key={platform.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setActivePlatform(platform)}
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg mr-4 ${platform.color} bg-opacity-10`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{platform.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {platform.description}
                      </p>
                      <div className="mt-3 flex">
                        <span className={`text-xs ${
                          platform.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          platform.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        } px-2 py-1 rounded-full`}>
                          {platform.difficulty.charAt(0).toUpperCase() + platform.difficulty.slice(1)}
                        </span>
                        <a 
                          href={platform.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {activePlatform && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${activePlatform.color} bg-opacity-10`}>
                    {activePlatform.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{activePlatform.name}</h2>
                    <p className="text-sm text-gray-600">{activePlatform.description}</p>
                  </div>
                </div>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setActivePlatform(null)}
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {activePlatform.topics.map((topic) => (
                    <span 
                      key={topic} 
                      className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Getting Started</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-2 text-sm">
                  <li>Create an account on {activePlatform.name}</li>
                  <li>Complete the onboarding process and select your programming language</li>
                  <li>Start with easy problems to build confidence</li>
                  <li>Join contests to practice under time pressure</li>
                  <li>Review solutions after solving problems to learn better approaches</li>
                </ol>
              </div>
            </motion.section>
          )}
        </div>

        <div>
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Learning Path</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">1. Fundamentals</h3>
                <p className="text-sm text-green-700 mt-1">Master basic data structures and algorithms</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-800">2. Problem Solving</h3>
                <p className="text-sm text-yellow-700 mt-1">Practice easy and medium difficulty problems</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-800">3. Advanced Topics</h3>
                <p className="text-sm text-red-700 mt-1">Learn advanced algorithms and participate in contests</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentCompetitiveProgramming;
