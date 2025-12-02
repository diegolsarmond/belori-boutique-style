import { toast } from "sonner";

const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'belori-boutique-style-wnc7w.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = 'f9261efbff3cc511f0bbc740f924ea5a';

export async function storefrontApiRequest(query: string, variables: any = {}) {
  console.warn("Integração com Shopify removida. Retornando dados vazios.");
  return {
    data: {
      products: { edges: [] },
      productByHandle: null,
      cartCreate: {
        cart: {
          id: 'mock-cart-id',
          checkoutUrl: '#',
          totalQuantity: 0,
          cost: { totalAmount: { amount: '0', currencyCode: 'BRL' } },
          lines: { edges: [] }
        },
        userErrors: []
      }
    }
  };
}

export const STOREFRONT_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

export async function createStorefrontCheckout(items: any[]): Promise<string> {
  console.warn("Integração com Shopify removida. Checkout desativado.");
  toast.error("Checkout desativado (Integração Shopify removida)");
  return "#";
}
