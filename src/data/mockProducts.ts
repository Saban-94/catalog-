export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  specs: {
    dryingTime?: string;
    coverage?: string;
    applicationMethod?: string;
    [key: string]: any;
  };
  image: string;
  driveFolderLink?: string;
  tutorialLink?: string;
  relatedSkus?: string[];
  upsellSkus?: string[];
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "SBN-001",
    name: "צבע אקרילי פרימיום - ח.סבן",
    category: "צבעים",
    price: 180,
    stock: 45,
    unit: "ליטר",
    specs: {
      dryingTime: "2-4 שעות",
      coverage: "10-12 מ\"ר לליטר",
      applicationMethod: "רולר או מברשת",
    },
    image: "https://picsum.photos/seed/paint/400/300",
    driveFolderLink: "#",
    tutorialLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    relatedSkus: ["SBN-002", "SBN-003"],
  },
  {
    id: "2",
    sku: "SBN-002",
    name: "דבק קרמיקה עוצמתי",
    category: "דבקים וחומרי מליטה",
    price: 65,
    stock: 120,
    unit: "ק\"ג",
    specs: {
      dryingTime: "24 שעות",
      coverage: "4-6 ק\"ג למ\"ר",
      applicationMethod: "מאג' פנצ'ב",
    },
    image: "https://picsum.photos/seed/glue/400/300",
    driveFolderLink: "#",
    relatedSkus: ["SBN-001"],
  },
  {
    id: "3",
    sku: "SBN-003",
    name: "מברשת צבע מקצועית 3 אינץ'",
    category: "כלי עבודה",
    price: 15,
    stock: 200,
    unit: "יחידה",
    specs: {
      material: "שיער טבעי",
    },
    image: "https://picsum.photos/seed/brush/400/300",
    driveFolderLink: "#",
    upsellSkus: ["SBN-001"],
  }
];
