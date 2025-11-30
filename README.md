# 🧩 Wordle Solver Bot

> **An optimal Wordle solver powered by Information Theory (Shannon Entropy).**
> Built with Next.js 16, React 19, and Web Workers for high-performance analysis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 📖 About

This project is a high-performance web application designed to solve Wordle puzzles with mathematical precision. It uses **Shannon Entropy** to calculate the "information gain" of every possible guess, suggesting words that eliminate the most uncertainty at each step.

Unlike simple solvers that just filter words, this bot looks ahead to maximize the probability of solving the puzzle in the fewest attempts.

## ✨ Key Features

-   **🧠 Information Theory Algorithm**: Calculates the expected information gain (in bits) for every possible guess.
-   **⚡ High Performance**: Heavy calculations are offloaded to **Web Workers**, keeping the UI buttery smooth (60fps) even while analyzing thousands of words.
-   **🎨 Modern UI**: A beautiful, responsive interface built with **Tailwind CSS v4** and **Shadcn/UI**.
-   **📱 Fully Responsive**: Optimized for both desktop and mobile devices.
-   **📊 Real-time Stats**: Visualizes entropy scores, remaining possibilities, and calculation time.
-   **🌓 Dark Mode**: Seamless support for light and dark themes.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Library**: [React 19](https://react.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Components**: [Shadcn/UI](https://ui.shadcn.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Concurrency**: Web Workers API

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   pnpm (recommended) or npm/yarn

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/P4ST4S/next-wordle-bot.git
    cd next-wordle-bot
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    pnpm dev
    ```

4.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🧮 How It Works

The solver uses the concept of **Entropy** from Information Theory:

1.  **Filter**: It starts with a list of all valid 5-letter words (approx. 13,000).
2.  **Simulate**: For a given candidate guess, it simulates every possible hidden answer remaining in the pool.
3.  **Pattern Distribution**: It calculates the probability of seeing each color pattern (Green/Yellow/Gray) for that guess.
4.  **Entropy Calculation**: It computes the Shannon Entropy:

    $$
    E[I] = \sum_{p} P(p) \cdot \log_2\left(\frac{1}{P(p)}\right)
    $$

    Where $P(p)$ is the probability of pattern $p$.
5.  **Rank**: Words with higher entropy provide more information on average, narrowing down the search space faster.

## 📂 Project Structure

```
├── app/                # Next.js App Router pages and layouts
├── components/         # React components
│   ├── solver/         # Game-specific components (Board, Input, etc.)
│   └── ui/             # Reusable UI components (Buttons, Cards, etc.)
├── hooks/              # Custom React hooks (Game state, Worker management)
├── lib/                # Utilities and core logic
│   ├── logic/          # Entropy calculation and game rules
│   └── types/          # TypeScript definitions
├── public/             # Static assets and data files
└── workers/            # Web Workers for background processing
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Antoine Rospars](https://github.com/P4ST4S)
