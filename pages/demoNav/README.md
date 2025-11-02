# Navigation & Page Lifecycle Demo (E2E)

This directory contains a simple end-to-end demonstration of the **Page() API** and **wx navigation methods** (`navigateTo`, `redirectTo`, `reLaunch`, `navigateBack`).

## Files

- `demoNav.sxml` / `demoNav.js` / `demoNav.json` / `demoNav.css` — Page A (Entry point)
- `demoBack.sxml` / `demoBack.js` / `demoBack.json` / `demoBack.css` — Page B (Destination)

## How to Run

1. **Build the project** to compile SXML templates:
   ```bash
   npm run build:dist
   ```
   
   or directly:
   ```bash
   node build.dist.js
   ```

2. **Open the compiled HTML** in your browser:
   ```
   dist/pages/demoNav/demoNav.html
   ```

3. **Open Developer Tools** (F12) to see console logs:
   - Lifecycle hooks will log when they fire (`onLoad`, `onReady`, `onShow`, `onHide`, `onUnload`)
   - Navigation events will log when wx APIs are called

## What to Test

### From `demoNav.html`:
- **navigateTo** → Navigates to `demoBack.html`, keeps `demoNav` in history stack.  
  You can use `navigateBack()` to return.
  
- **redirectTo** → Replaces `demoNav` with `demoBack` (no back button works).  
  `navigateBack()` will have no effect because there's no history.
  
- **reLaunch** → Clears the entire history stack and loads `demoBack`.  
  Again, `navigateBack()` will have no effect.

### From `demoBack.html`:
- **navigateBack()** → Returns to `demoNav` if you arrived via `navigateTo`.  
  Triggers `onShow` again on `demoNav`, not `onLoad`.
  
- **reLaunch to demoNav** → Clears history and reloads `demoNav` from scratch.  
  Triggers a new `onLoad`.

## Expected Console Output

When you navigate from **demoNav → demoBack** via `navigateTo`:
```
[demoNav] onLoad called {}
[demoNav] onReady called
[demoNav] onShow called
[demoNav] navigateTo → demoBack
[demoNav] onHide called
[demoBack] onLoad called {from: 'navigateTo'}
[demoBack] onReady called
[demoBack] onShow called
```

When you call `navigateBack()` from **demoBack**:
```
[demoBack] onHide called
[demoBack] onUnload called
[demoNav] onShow called
```

Notice that `onLoad` and `onReady` do **not** fire again for `demoNav` — only `onShow`. That's because the page instance was kept in memory.

## Learning Points

- **Page()** registers a page instance with lifecycle hooks.
- **wx.navigateTo()** keeps the current page in memory (you can go back).
- **wx.redirectTo()** and **wx.reLaunch()** destroy the current page.
- **wx.navigateBack()** only works if there's history (i.e., you used `navigateTo` to get there).
- **onShow** fires every time a page becomes visible (including when returning via `navigateBack`).

## Troubleshooting

- **Nothing happens when clicking buttons**: Check browser console for errors. Make sure `page.loader.js` and `Page()` definition are loaded.
- **navigateBack does nothing**: This is expected if you used `redirectTo` or `reLaunch` — there's no history to go back to.
- **Lifecycle logs missing**: Ensure you opened DevTools and the Page() is properly initialized before navigation.

## Next Steps

- Try adding more pages to test deeper navigation stacks.
- Experiment with passing query parameters via `?param=value` in URLs.
- Explore `setData()` to update page state and see SXML reactivity in action.

---

**Happy coding! 🚀**
