# Why this folder
The `pages` folder contains components that represent the individual pages of the application. You can build a page in two ways and that usually depends on the complexity of the page. For example:

```
pages/
  About.tsx
  dashboard/
   components/
   index.tsx
```
Since the `dashboard` page is complex we split it into multiple components. The `index.tsx` file is the entry point for the page and it imports all the necessary components. The `components` folder contains all the components that are used in the page.
