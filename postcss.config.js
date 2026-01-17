export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
}
3.  **Open `src/index.css`**. Delete the three `@tailwind...` lines and replace them with just this one line:
```css
@import "tailwindcss";
4.  **Send the fix to GitHub** by typing these three commands:
* `git add .`
* `git commit -m "fix tailwind config"`
* `git push`