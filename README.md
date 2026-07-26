# 🚀 SEALIT

## Find Real Problems. Build Real Solutions.

SEALIT is a web application that helps developers find real problems people are talking about online. Instead of spending hours thinking about what project to build, users can explore actual issues shared by developers on platforms like Reddit and Hacker News.

The idea for SEALIT came from our own experience. Every time we participated in a hackathon or started a new project, the hardest part wasn't coding—it was finding a problem worth solving. Most of the ideas we found were already available on YouTube or GitHub, and many projects ended up looking almost the same.

We wanted to build something that could help developers work on problems that people are actually facing.

SEALIT checks Reddit and Hacker News every 30 minutes for discussions related to development. Gemini AI reads those discussions and converts them into simple, easy-to-understand problem cards. Users can filter these problems based on their preferred technology stack and choose one that interests them.

Once a developer starts working on a problem, SEALIT continues to monitor new discussions related to that topic. This helps users stay updated with new feedback and improve their solution as more people share their experiences.

Our goal is simple: spend less time searching for ideas and more time building projects that solve real problems.

---

# 📌 Problem Statement

Many students and developers struggle to decide what project to build.

Most of the time, they end up following tutorials or copying projects from GitHub and YouTube. While these projects are good for learning, they don't always solve real problems or stand out during interviews and hackathons.

There is also no easy way to know what challenges developers are currently facing or whether a project idea is still relevant.

---

# 💡 Our Solution

SEALIT brings real developer problems together in one place.

Instead of asking users to search through hundreds of Reddit posts or Hacker News discussions, the platform automatically collects those conversations and organizes them into clear problem cards.

Developers can browse these cards, choose a problem that matches their skills, and start building immediately. As they continue working, SEALIT keeps tracking the same topic and shows new discussions whenever they appear, helping users improve their projects with fresh community feedback.

---

# ✨ Features

* Personalized feed of real developer problems
* Problem cards generated using Gemini AI
* Technology-based recommendations
* Search and filter functionality
* In-browser coding workspace
* GitHub integration
* Live tracking of related discussions
* Community reviews and ratings
* Simple and responsive user interface

---

# 🛠 Tech Stack

### Frontend

* Next.js
* React
* TypeScript

### Backend

* Node.js

### Database

* Supabase

### AI Integration

* Gemini API

### Version Control

* Git & GitHub

---

# ⚙️ How It Works

1. Create an account and log in.
2. Select your preferred technology stack.
3. Browse problem cards generated from Reddit and Hacker News.
4. Choose a problem you want to solve.
5. Start building your project.
6. Push your code to GitHub.
7. Get notified when new discussions related to your selected problem appear.
8. Share your project with the community and receive feedback.

---

# 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/sealit.git
```

### Move to the project folder

```bash
cd sealit
```

### Install dependencies

```bash
npm install
```

### Create a `.env` file

Add the following environment variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Start the development server

```bash
npm run dev
```

Open your browser and visit:

```
http://localhost:3000
```

---

# 🌱 Future Improvements

Some ideas we would like to work on in the future are:

* Support for Stack Overflow and Product Hunt
* Better AI recommendations
* Team collaboration
* Project analytics
* Resume and portfolio generation
* Recruiter dashboard
* Mobile application

---

# 👥 Who Can Use SEALIT?

* Students
* Beginner developers
* Hackathon participants
* Open-source contributors
* Freelancers
* Anyone looking for meaningful project ideas

---

# ❤️ Why We Built SEALIT

As students, we've often spent more time searching for project ideas than actually building projects. We realized that there are thousands of real problems being discussed online every day, but they're scattered across different platforms.

SEALIT is our attempt to bring those problems together, make them easier to understand, and help developers build solutions that are actually useful. We hope it encourages people to create projects that solve real needs instead of repeating the same tutorial-based ideas.

---

# 🤝 Contributing

If you'd like to contribute, feel free to fork the repository, create a new branch, make your changes, and open a pull request. Contributions and suggestions are always welcome.

---

# 📄 License

This project was created for educational purposes and developed as part of a hackathon.

