# English Dictionary Application using Radix-Trie

A full-stack English dictionary application that uses a **Radix Trie (compressed Trie)** as the primary indexing data structure. Built for an Advanced Data Structures & Algorithms course.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![Tech Stack](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)
![Tech Stack](https://img.shields.io/badge/Language-Python%203.11+-3776AB?logo=python)

---

## Features

- **Add Word** – Insert a word with its meaning; shows trie before/after with node split explanation
- **Delete Word** – Remove a word; shows trie before/after with node merge explanation
- **Search Word** – Look up a word; shows traversal path and confirms trie is unchanged
- **Radix Trie Visualization** – Real-time text-tree display of the compressed trie structure
- **Operation History** – Detailed log of all operations with timestamps
- **Dictionary Entries Table** – Filterable list of all stored words and meanings
- **Data Persistence** – Entries saved to JSON and loaded automatically on startup

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Lucide React |
| Backend | Python 3.11+, FastAPI, Pydantic |
| Data Structure | Radix Trie (implemented from scratch) |
| Persistence | Local JSON file |

---

## Architecture Overview

```
┌─────────────────────────┐     HTTP/REST     ┌─────────────────────────┐
│     Next.js Frontend    │ ◄───────────────► │   FastAPI Backend       │
│  (React + TypeScript)   │                   │  ┌──────────────────┐  │
│                         │                   │  │   Radix Trie     │  │
│  • Action Panels        │                   │  │   (in-memory)    │  │
│  • Trie Viewer          │                   │  └────────┬─────────┘  │
│  • Result Display       │                   │           │            │
│  • Entries Table        │                   │  ┌────────▼─────────┐  │
│  • History Log          │                   │  │ dictionary.json  │  │
└─────────────────────────┘                   │  └──────────────────┘  │
                                              └─────────────────────────┘
```

---

## Installation

### Prerequisites
- **Python 3.11+** (with pip)
- **Node.js 18+** (with npm)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

---

## Running the Application

### 1. Start the Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
The API will be available at [http://localhost:8000](http://localhost:8000).
Interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
The web app will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
/
├── README.md
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── components.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── badge.tsx
│   │   │   ├── dictionary/
│   │   │   │   ├── AddWordPanel.tsx
│   │   │   │   ├── DeleteWordPanel.tsx
│   │   │   │   ├── SearchWordPanel.tsx
│   │   │   │   ├── OperationResultPanel.tsx
│   │   │   │   ├── EntriesTable.tsx
│   │   │   │   └── OperationHistory.tsx
│   │   │   └── trie/
│   │   │       └── TrieViewer.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── utils.ts
│   └── public/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   ├── radix_trie.py
│   │   ├── storage.py
│   │   └── history.py
│   ├── data/
│   │   └── dictionary.json
│   ├── requirements.txt
│   └── tests/
│       └── test_radix_trie.py
│
├── User_Guide/
│   └── explain.md
```

---

## Radix Trie in This Project

A **Radix Trie** (also called a compressed Trie or Patricia Trie) stores strings by compressing chains of single-child nodes into single edges labeled with substrings.

For example, words `apple`, `apply`, and `application`:

```
(root)
 └── appl
      ├── e         [END] meaning="a fruit"
      ├── ication   [END] meaning="a computer program"
      └── y         [END] meaning="to put into use"
```

Key operations:
- **Insert**: May split an existing edge when words share a partial prefix
- **Delete**: May merge edges when nodes become unnecessary after removal
- **Search**: Traverses edges without modifying the tree (read-only)

---

## Demo Workflow

1. Start both backend and frontend
2. The app loads with a pre-populated sample dictionary
3. **Add** a new word → observe the trie before/after with split explanation
4. **Search** for a word → see the traversal path through the trie
5. **Delete** a word → observe edge removal and potential merges
6. Check the **Operation History** for a complete log
7. Browse all words in the **Dictionary Entries** table

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/entries` | Get all dictionary entries |
| `GET` | `/api/trie` | Get current trie visualization |
| `POST` | `/api/words` | Add/update a word (body: `{word, meaning}`) |
| `DELETE` | `/api/words/{word}` | Delete a word |
| `GET` | `/api/search?word=...` | Search for a word |
| `GET` | `/api/history` | Get operation history |

---

## Testing

Run backend unit tests:
```bash
cd backend
pytest tests/test_radix_trie.py -v
```

---

## License

This project is for academic purposes.
