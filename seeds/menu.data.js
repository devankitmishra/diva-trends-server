// server/seeds/menu.data.js
export default [
  { title: "Home", path: "/", visible: true },
  { title: "Deals", path: "/deals", visible: true },
  { title: "Newly Added", path: "/newly-added", visible: true },

  {
    title: "WomensWear",
    path: "/women",
    visible: true,
    children: [
      {
        title: "TopWear",
        path: "topwear",
        children: [
          { title: "Kurti", path: "kurti" },
          { title: "Shirt", path: "shirt" },
          { title: "Tops & Tees", path: "tops-tees" },
          { title: "Blouse", path: "blouse" },
        ],
      },
      {
        title: "BottomWear",
        path: "bottomwear",
        children: [
          { title: "Pajama", path: "pajama" },
          { title: "Pant", path: "pant" },
          { title: "Skirt", path: "skirt" },
          { title: "Leggings", path: "leggings" },
        ],
      },
      {
        title: "FullWear / Set",
        path: "set",
        children: [
          { title: "Kurti Pajama Set", path: "kurti-pajama-set" },
          { title: "Shirt Pant Set", path: "shirt-pant-set" },
        ],
      },
      {
        title: "Accessories",
        path: "accessories",
        children: [
          { title: "Dupatta", path: "dupatta" },
          { title: "Belts", path: "belts" },
        ],
      },
    ],
  },

  {
    title: "MensWear",
    path: "/men",
    visible: true,
    children: [
      {
        title: "TopWear",
        path: "topwear",
        children: [
          { title: "Kurta", path: "kurta" },
          { title: "Shirt", path: "shirt" },
          { title: "T-Shirts", path: "t-shirts" },
        ],
      },
      {
        title: "BottomWear",
        path: "bottomwear",
        children: [
          { title: "Pajama", path: "pajama" },
          { title: "Pant", path: "pant" },
          { title: "Jeans", path: "jeans" },
        ],
      },
      {
        title: "FullWear / Set",
        path: "set",
        children: [
          { title: "Kurta Pajama Set", path: "kurta-pajama-set" },
          { title: "Shirt Pant Set", path: "shirt-pant-set" },
        ],
      },
    ],
  },

  { title: "Shop All", path: "/all", visible: true },
  { title: "Help & Support", path: "/help", visible: true },
];
