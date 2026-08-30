Live URL: week8-project-kp1v.vercel.app
Repo URL: https://github.com/OKVSchool/week8-project.git. 

Stack:
Data Shape: Relational
Database: PostgreSQL
Backend Language: JavaScript / TypeScript (Node)
Backend Framework: Next.js
Frontend: React (via Next.js)
Hosting: Vercel

Review:
It is my stack after removing the extras (see Friction section)
1. My initial prompt - "I work as a mobile forklift technician. My job consists of recieving a work order, travelling to the customer location, making contact with the point of contact, locating the equipment, performing the work, documenting the work completed, what still needs to be done, any damages or needed repairs, the units hours, then quoting the parts and repairs, sending a service report to the customers email, and documenting any parts and labor. I also track the time I spend travelling to and from the customer location and how much time I spend there. I want to build a web app that will allow me to document everything related to the job." with a screenshot of my decision document.

2. Database URL is in .env. Verified .env is in .gitignore, committed and ran git status to ensure .env is left out. Checked Checked the dependencies list in package.json and found multiple additions that were not in the decision document and removed them.

3. Ran it locally with no issues.

4. Checked .git ignore and ran git status once more to ensure .env was ignored. Pushed commits to git repo.

5. Deployed and verified deployment on computer and phone. Both loaded cleanly.

Friction: Claude added Tailwind CSS, Shadcn/ui, React Hook Form, Zod, and ESLint to my stack without verification. Checked them individually and had them removed.