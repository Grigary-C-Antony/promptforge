export const PROMPT_TEMPLATES = [
  {
    "title": "Understand Any Topic Using First Principles Thinking",
    "prompt": "I'm struggling to understand **[Topic]**.\n\nExplain it using the First Principles Thinking framework.\n\nBreak the topic down into its most fundamental concepts, explain each one in simple language, then rebuild the complete understanding step by step.\n\nUse practical examples, analogies, and real-world applications to help me fully grasp the concept."
  },
  {
    "title": "Become Better at Using ChatGPT",
    "prompt": "Create a beginner-friendly guide to using ChatGPT effectively.\n\nCover the following topics:\n\n- Writing effective prompts\n- Prompt engineering fundamentals\n- Using roles and personas\n- Giving context\n- Structuring prompts\n- Refining AI responses\n- Common mistakes to avoid\n- Advanced prompting techniques\n\nInclude practical examples for each topic.\n\nKeep the guide under 500 words."
  },
  {
    "title": "Learn Any Skill in 30 Days",
    "prompt": "I want to learn **[Skill]** and I'm a complete beginner.\n\nCreate a structured 30-day learning roadmap that gradually builds my knowledge from beginner to intermediate.\n\nFor each day include:\n\n- Learning objective\n- Topics to study\n- Practice exercises\n- Recommended resources\n- Mini project (when appropriate)\n\nThe plan should be realistic and require approximately one hour per day."
  },
  {
    "title": "Summarize Long Documents",
    "prompt": "Summarize the following content into clear, concise bullet points.\n\nFocus on:\n\n- Key insights\n- Important facts\n- Main arguments\n- Action items\n- Conclusions\n\nIf appropriate, include a one-paragraph executive summary before the bullet points.\n\nContent:\n\n[Paste your text here]"
  },
  {
    "title": "Generate Prompts for My Profession",
    "prompt": "I'm a **[Profession]** and I want to become more productive using AI.\n\nGenerate the 10 most valuable prompts I should use in my daily work.\n\nFor each prompt include:\n\n- Prompt title\n- The complete prompt\n- What it helps accomplish\n- Best AI model to use\n- Expected outcome"
  },
  {
    "title": "Improve My Writing",
    "prompt": "Review the writing below as a professional editor.\n\nPlease:\n\n- Correct grammar\n- Fix spelling mistakes\n- Improve sentence structure\n- Increase clarity\n- Remove unnecessary words\n- Improve readability\n- Suggest stronger wording where appropriate\n\nAt the end, provide a short explanation of the most important improvements.\n\nWriting:\n\n[Paste your writing here]"
  },
  {
    "title": "Build a Real-Time To-Do Dashboard",
    "prompt": "Build a production-ready real-time task management dashboard using Next.js and Supabase.\n\nRequirements:\n\n- Create a Supabase table named \"todos\" with the following fields:\n  - title\n  - status\n  - priority\n  - assigned_agent\n  - updated_at\n\nEnable Supabase Realtime so all updates are reflected instantly via WebSockets without refreshing the page.\n\nFeatures:\n\n- Create tasks\n- Edit tasks\n- Delete tasks\n- Update status\n- Assign users\n- Priority badges\n- Real-time synchronization\n- Loading states\n- Error handling\n\nDesign:\n\n- Modern dark theme\n- Minimal interface\n- Fully responsive\n- Clean dashboard layout\n- Reusable React components"
  },
  {
    "title": "Create a Persistent Memory System for Claude",
    "prompt": "Create a persistent memory system for Claude.\n\nGenerate a"
  },
  {
    "title": "Explain Complex Concepts Like a Teacher",
    "prompt": "Act as an expert teacher.\n\nExplain **[Topic]** as if you're teaching someone with no prior knowledge.\n\nStart with the basics, then gradually introduce advanced concepts.\n\nUse:\n\n- Simple language\n- Real-world examples\n- Analogies\n- Diagrams (using Markdown if possible)\n- Common misconceptions\n- Practice questions\n- Summary\n\nFinish with a short quiz to test my understanding."
  },
  {
    "title": "Turn an Idea into a Complete Product",
    "prompt": "I have the following idea:\n\n[Describe your idea]\n\nHelp me transform it into a production-ready product.\n\nGenerate:\n\n- Business validation\n- Target audience\n- Competitor analysis\n- Unique selling proposition\n- Feature list\n- Product Requirements Document (PRD)\n- User stories\n- Database design\n- System architecture\n- UI/UX recommendations\n- Tech stack\n- Development roadmap\n- Deployment strategy\n- Marketing plan\n\nPresent the response in a professional, structured format suitable for a development team."
  },
  {
    "title": "Turn Meeting Notes into Action Items",
    "prompt": "Convert the meeting notes below into a structured action plan.\n\nInclude:\n\n- Key decisions\n- Action items\n- Owners\n- Deadlines\n- Risks\n- Follow-up questions\n\nMeeting Notes:\n\n[Paste notes here]"
  },
  {
    "title": "Write Professional Emails",
    "prompt": "Write a professional email based on the information below.\n\nTone:\n<Professional | Friendly | Formal>\n\nPurpose:\n<Describe purpose>\n\nKeep the email concise, persuasive, and grammatically correct."
  },
  {
    "title": "Create a Business Plan",
    "prompt": "Generate a complete business plan for the following idea:\n\n[Business Idea]\n\nInclude market analysis, revenue model, marketing strategy, operations, financial projections, risks, and growth opportunities."
  },
  {
    "title": "Generate Social Media Content",
    "prompt": "Create a 30-day social media content calendar for:\n\nBusiness:\n[Business]\n\nAudience:\n[Audience]\n\nInclude captions, hashtags, posting ideas, and CTAs."
  },
  {
    "title": "Brainstorm Startup Ideas",
    "prompt": "Generate 20 startup ideas in the following industry:\n\n[Industry]\n\nFor each idea include the problem, solution, target audience, and monetization strategy."
  },
  {
    "title": "Analyze Competitors",
    "prompt": "Analyze the following competitors:\n\n[List competitors]\n\nCompare pricing, features, strengths, weaknesses, and opportunities. Finish with recommendations."
  },
  {
    "title": "Generate Interview Questions",
    "prompt": "Create 30 interview questions for the role of:\n\n[Job Title]\n\nInclude beginner, intermediate, and advanced questions with sample answers."
  },
  {
    "title": "Improve Resume",
    "prompt": "Review my resume below.\n\nImprove wording, quantify achievements, optimize for ATS, and suggest stronger bullet points.\n\nResume:\n\n[Paste Resume]"
  },
  {
    "title": "Create a Study Guide",
    "prompt": "Create a complete study guide for:\n\n[Topic]\n\nInclude summaries, diagrams (Markdown), key terms, revision notes, quizzes, and practice questions."
  },
  {
    "title": "Explain Code",
    "prompt": "Explain the following code line by line.\n\nInclude:\n\n- Purpose\n- Logic\n- Time complexity\n- Possible improvements\n- Best practices\n\nCode:\n\n[Paste code]"
  },
  {
    "title": "Refactor Code",
    "prompt": "Refactor the code below for readability, performance, and maintainability without changing functionality.\n\nCode:\n\n[Paste code]"
  },
  {
    "title": "Generate SQL Queries",
    "prompt": "Write optimized SQL queries for the following requirement:\n\n[Requirement]\n\nExplain each query and recommend indexes where appropriate."
  },
  {
    "title": "Build an API",
    "prompt": "Generate a production-ready REST API for:\n\n[Application]\n\nInclude routes, validation, authentication, error handling, and example responses."
  },
  {
    "title": "Create Technical Documentation",
    "prompt": "Write developer documentation for:\n\n[Feature]\n\nInclude overview, setup, API usage, examples, troubleshooting, and FAQs."
  },
  {
    "title": "Debug an Error",
    "prompt": "Analyze the following error.\n\nExplain the root cause, debugging steps, and provide a corrected solution.\n\nError:\n\n[Paste error]\n\nCode:\n\n[Paste code]"
  },
  {
    "title": "Plan a Product Launch",
    "prompt": "Create a complete product launch strategy for:\n\n[Product]\n\nInclude timeline, marketing channels, launch checklist, KPIs, and post-launch actions."
  },
  {
    "title": "Design a Database",
    "prompt": "Design a scalable relational database for:\n\n[Application]\n\nInclude tables, relationships, indexes, constraints, and ER diagram description."
  },
  {
    "title": "Generate API Documentation",
    "prompt": "Create OpenAPI-style documentation for the following endpoint:\n\n[Endpoint Details]\n\nInclude requests, responses, errors, and examples."
  },
  {
    "title": "Build a Learning Roadmap",
    "prompt": "Create a 90-day roadmap to master:\n\n[Technology]\n\nInclude weekly milestones, projects, resources, and assessments."
  },
  {
    "title": "Create SOP Documentation",
    "prompt": "Write a Standard Operating Procedure (SOP) for:\n\n[Process]\n\nInclude purpose, scope, prerequisites, step-by-step instructions, responsibilities, quality checks, and troubleshooting."
  }
];