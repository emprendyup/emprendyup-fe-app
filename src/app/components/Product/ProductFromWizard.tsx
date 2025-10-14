'use client';
// Query to get all variant combinations for a product
const GET_VARIANT_COMBINATIONS = gql`
  query GetVariantCombinations($productId: String!) {
    variantCombinationsByProduct(productId: $productId) {
      id
      stockPrices {
        id
        price
        stock
      }
      variants {
        id
        name
        type
        jsonData
      }
    }
  }
`;

import { useState, useEffect } from 'react';
import {
  Save,
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Circle,
  Info,
  DollarSign,
  Image,
  Palette,
  Ruler,
  Tag,
  Plus,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  CreateProductInput,
  Product,
  ProductCategory,
  ProductColor,
  ProductImage,
  ProductSize,
} from '../../utils/types/Product';
import { variantsToColors, variantsToSizes } from '../../utils/types/ProductVariants';
import { CategorySelector } from './CategorySelector';
import { ImageUploader } from './ImageUploader';
import { ColorPicker } from './ColorPicker';
import { SizeSelector } from './SizeSelector';
import { CustomVariantSelector } from './CustomVariantSelector';
import { VariantCombinationGenerator } from './VariantCombinationGenerator';

// GraphQL Mutation
const CREATE_PRODUCT_WITH_URLS = gql`
  mutation CreateProductWithUrls($input: CreateProductWithUrlsInput!) {
    createProductWithUrls(input: $input) {
      id
      name
      title
      description
      price
      currency
      storeId
      externalId
      available
      inStock
      stock
      imageUrl
      createdAt
      updatedAt
      categories {
        category {
          id
          name
          slug
          description
        }
      }
      colors {
        color
        colorHex
      }
      sizes {
        size
      }
      images {
        id
        url
        order
      }
      comments {
        id
        comment
        rating
      }
    }
  }
`;
const GET_STORE_CONFIG = gql`
  query GetStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
    }
  }
`;
const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      title
      description
      price
      currency
      available
      inStock
      stock
      categories {
        category {
          id
          name
          slug
        }
      }
      colors {
        color
        colorHex
      }
      images {
        url
        order
      }
      createdAt
      updatedAt
    }
  }
`;
const GET_CATEGORIES_BY_STORE = gql`
  query GetCategoriesByStore($storeId: ID!) {
    categoriesByStore(storeId: $storeId) {
      id
      name
      slug
      description
      isActive
      order
      createdAt
      updatedAt
      store {
        id
        name
      }
      parent {
        id
        name
        slug
      }
    }
  }
`;
// New GraphQL operations for variant combinations
const CREATE_VARIANT_COMBINATION = gql`
  mutation CreateVariantCombination($input: CreateVariantCombinationInput!) {
    createVariantCombination(input: $input) {
      combinationId
      stockPriceId
    }
  }
`;

// Query to get all variants for a product (to get their IDs)
const GET_PRODUCT_VARIANTS = gql`
  query GetProductVariants($productId: String!) {
    productVariantsByProduct(productId: $productId) {
      id
      name
      type
      jsonData
    }
  }
`;

// Mutation to create variants
const CREATE_VARIANTS = gql`
  mutation CreateVariants($inputs: [CreateVariantInput!]!) {
    createVariants(inputs: $inputs)
  }
`;

// REMOVED: GET_VARIANT_COMBINATIONS (invalid field)

const GENERATE_ALL_COMBINATIONS = gql`
  query GenerateAllCombinations($productId: String!) {
    generateVariantCombinations(productId: $productId) {
      name
      variants {
        id
        variant {
          id
          typeVariant
          nameVariant
          jsonData
        }
      }
      stocks {
        id
        price
        stock
        available
      }
    }
  }
`;

const UPDATE_STOCK = gql`
  mutation UpdateStock($stockId: String!, $input: UpdateStockInput!) {
    updateStockForVariantCombination(stockId: $stockId, input: $input) {
      id
      price
      stock
      available
    }
  }
`;

interface ProductFormWizardProps {
  product?: Product;
  onSave: (productData: CreateProductInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type StepType = 'basic' | 'pricing' | 'categories' | 'images' | 'description' | 'review';

interface Step {
  id: StepType;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

// Custom variant interface for the form
interface CustomVariant {
  id: string;
  type: string;
  name: string;
  value: string;
}

// Variant combination interface
interface VariantCombination {
  id: string;
  name: string;
  variants: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  stock: number;
  price?: number;
  stockId?: string; // For updating existing stocks
}

export function ProductFormWizard({
  product,
  onSave,
  onCancel,
  loading = false,
}: ProductFormWizardProps) {
  // Sync form state with product prop when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        title: product.title || '',
        description: product.description || '',
        price: product.price || 0,
        currency: product.currency || 'COP',
        available: product.available ?? true,
        inStock: product.inStock ?? true,
      });
      setImages(product.images?.map((img, index) => ({ ...img, order: index })) || []);
      setColors(
        (() => {
          const oldColors =
            product.colors?.map((color: any) => ({
              id: color.id,
              name: color.color || color.name || '',
              hex: color.colorHex || color.hex || '#000000',
            })) || [];
          if (product.variants && product.variants.length > 0) {
            const variantColors = variantsToColors(product.variants);
            const mergedColors = [...oldColors, ...variantColors];
            return mergedColors.filter(
              (color, index, self) => index === self.findIndex((c) => c.name === color.name)
            );
          }
          return oldColors;
        })()
      );
      setSizes(
        (() => {
          const oldSizes =
            product.sizes?.map((size: any) => ({
              id: size.id,
              name: size.name,
              value: size.value,
            })) || [];
          if (product.variants && product.variants.length > 0) {
            const variantSizes = variantsToSizes(product.variants);
            const mergedSizes = [...oldSizes, ...variantSizes];
            return mergedSizes.filter(
              (size, index, self) => index === self.findIndex((s) => s.name === size.name)
            );
          }
          return oldSizes;
        })()
      );
      // Robustly map categories to ProductCategory shape
      // Map and deduplicate categories by id
      const mappedCategories = (product.categories || []).map((cat: any) => {
        const c = cat.category || cat;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || '',
        };
      });
      // Deduplicate by id
      const uniqueCategories = mappedCategories.filter(
        (cat, idx, arr) => arr.findIndex((c) => c.id === cat.id) === idx
      );
      setCategories(uniqueCategories);
      if ('customVariants' in product && Array.isArray((product as any).customVariants)) {
        setCustomVariants((product as any).customVariants);
      } else {
        setCustomVariants([]);
      }
    }
  }, [product]);
  // Error state for form validation
  const [errors, setErrors] = useState<any>({});

  // Saving/loading state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const { data, error } = useQuery(GET_STORE_CONFIG, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId,
  });
  const store = data?.store;

  // Step navigation state
  const [currentStep, setCurrentStep] = useState<StepType>('basic');

  // Stepper UI for direct navigation
  const Stepper = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.has(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => goToStep(step.id)}
            className={`flex items-center px-4 py-2 rounded-full border transition-colors duration-150 mx-1
              ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isCompleted
                    ? 'bg-green-100 text-green-700 border-green-400'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
              }
            `}
            style={{
              fontWeight: isActive ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            <span className="mr-2">{step.icon}</span>
            {step.title}
          </button>
        );
      })}
    </div>
  );
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customVariants, setCustomVariants] = useState<CustomVariant[]>([]);

  // --- Helper: validateStep ---
  function validateStep(stepId: StepType): boolean {
    // TODO: Implement actual validation logic for each step
    return true;
  }

  // --- Helper: isStepCompleted ---
  function isStepCompleted(stepId: StepType): boolean {
    // TODO: Implement actual logic for step completion
    return completedSteps.has(stepId);
  }

  // --- Helper: goToStep ---
  function goToStep(stepId: StepType) {
    setCurrentStep(stepId);
  }
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set());

  // State for loading variant combinations
  const [loadingCombinations, setLoadingCombinations] = useState(false);

  // GraphQL mutations and queries
  const [createProductWithUrls] = useMutation(CREATE_PRODUCT_WITH_URLS);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [createVariantCombination] = useMutation(CREATE_VARIANT_COMBINATION);
  const [updateStock] = useMutation(UPDATE_STOCK);
  const [createVariants] = useMutation(CREATE_VARIANTS);

  // Query to get all variant combinations for the product
  const { data: variantCombinationsData } = useQuery(GET_VARIANT_COMBINATIONS, {
    variables: { productId: product?.id || '' },
    skip: !product?.id,
    fetchPolicy: 'cache-and-network',
  });
  const { data: categoriesData, refetch } = useQuery(GET_CATEGORIES_BY_STORE, {
    variables: { storeId: userData?.storeId },
    skip: !userData?.storeId,
  });

  // REMOVED: Query for existing variant combinations (invalid field)
  // If you need variant data, use productVariantsData from GET_PRODUCT_VARIANTS

  // Query to get all variant IDs for the product (for use in combinations)
  const { data: productVariantsData, refetch: refetchProductVariants } = useQuery(
    GET_PRODUCT_VARIANTS,
    {
      variables: { productId: product?.id || '' },
      skip: !product?.id,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Sync colors and sizes from productVariantsData (all DB variants)
  useEffect(() => {
    if (productVariantsData && productVariantsData.productVariantsByProduct) {
      const allVariants = productVariantsData.productVariantsByProduct;

      // Colors
      setColors(
        allVariants
          .filter((v: { type: string }) => v.type?.toLowerCase() === 'color')
          .map((v: { id: any; name: any; jsonData: { hex: any; color: any } }) => ({
            id: v.id,
            name: v.name,
            hex: v.jsonData?.hex || v.jsonData?.color || '#000000',
          }))
      );

      // Sizes
      setSizes(
        allVariants
          .filter((v: { type: string }) => v.type?.toLowerCase() === 'size')
          .map((v: { id: any; name: any; jsonData: { value: any } }) => ({
            id: v.id,
            name: v.name,
            value: v.jsonData?.value || v.name,
          }))
      );

      // Custom Variants (other types)
      interface BackendVariant {
        id: string;
        type: string;
        name: string;
        jsonData?: {
          value?: string;
          [key: string]: any;
        };
      }

      interface CustomVariantForm {
        id: string;
        type: string;
        name: string;
        value: string;
      }

      setCustomVariants(
        (allVariants as BackendVariant[])
          .filter(
            (v: BackendVariant) =>
              v.type?.toLowerCase() !== 'color' && v.type?.toLowerCase() !== 'size'
          )
          .map(
            (v: BackendVariant): CustomVariantForm => ({
              id: v.id,
              type: v.type,
              name: v.name,
              value: v.jsonData?.value || '',
            })
          )
      );
    }
  }, [productVariantsData]);

  // Define steps
  const steps: Step[] = [
    {
      id: 'basic',
      title: 'Información',
      description: 'Nombre y título ',
      icon: <Info className="w-5 h-5" />,
      required: true,
    },
    {
      id: 'pricing',
      title: 'Precio e Inventario',
      description: 'Precio, moneda y cantidad en stock',
      icon: <DollarSign className="w-5 h-5" />,
      required: true,
    },
    {
      id: 'categories',
      title: 'Categorías',
      description: 'Clasificación del producto',
      icon: <Tag className="w-5 h-5" />,
      required: true,
    },
    {
      id: 'images',
      title: 'Imágenes y Variantes',
      description: 'Fotos, colores y tallas del producto',
      icon: <Image className="w-5 h-5" />,
      required: true,
    },
    {
      id: 'description',
      title: 'Descripción',
      description: 'Detalles adicionales del producto',
      icon: <CheckCircle className="w-5 h-5" />,
      required: true,
    },
    {
      id: 'review',
      title: 'Revisar',
      description: 'Confirma todos los detalles',
      icon: <CheckCircle className="w-5 h-5" />,
      required: true,
    },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || '',
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    currency: product?.currency || 'COP',
    available: product?.available ?? true,
    inStock: product?.inStock ?? true,
  });

  // Calculate total stock from variant combinations
  const calculateTotalStock = (): number => {
    if (variantCombinations.length === 0) {
      // If no variant combinations, return 0 (stock is managed through variants)
      return 0;
    }
    // Sum all variant combination stocks
    return variantCombinations.reduce((total, combination) => total + (combination.stock || 0), 0);
  };

  // Get the effective stock (calculated from variants or manual)
  const effectiveStock = calculateTotalStock();

  // Update inStock status when variant combinations change
  useEffect(() => {
    if (variantCombinations.length > 0) {
      const calculatedStock = variantCombinations.reduce(
        (total, combination) => total + (combination.stock || 0),
        0
      );
      setFormData((prev) => ({
        ...prev,
        inStock: calculatedStock > 0, // Automatically set inStock based on calculated stock
      }));
    }
  }, [variantCombinations]);

  // Sync variant combinations from backend to state
  useEffect(() => {
    if (variantCombinationsData && variantCombinationsData.variantCombinationsByProduct) {
      setVariantCombinations(
        variantCombinationsData.variantCombinationsByProduct.map((comb: any) => ({
          id: comb.id,
          name: comb.variants.map((v: any) => v.name).join(' / '),
          variants: comb.variants.map((v: any) => ({
            type: v.type,
            name: v.name,
            value: v.jsonData?.value || '',
          })),
          stock: comb.stockPrices?.[0]?.stock ?? 0,
          price: comb.stockPrices?.[0]?.price ?? 0,
          stockId: comb.stockPrices?.[0]?.id ?? undefined,
        }))
      );
    }
  }, [variantCombinationsData]);
  const [images, setImages] = useState<ProductImage[]>(
    product?.images?.map((img, index) => ({
      ...img,
      order: index,
    })) || []
  );

  // Initialize colors and sizes from both old fields and variants
  const [colors, setColors] = useState<ProductColor[]>(() => {
    // First try to get colors from old format
    const oldColors =
      product?.colors?.map((color: any) => ({
        id: color.id,
        name: color.color || color.name || '',
        hex: color.colorHex || color.hex || '#000000',
      })) || [];

    // If we have variants, also extract colors from them
    if (product?.variants && product.variants.length > 0) {
      const variantColors = variantsToColors(product.variants);
      // Merge and deduplicate
      const mergedColors = [...oldColors, ...variantColors];
      return mergedColors.filter(
        (color, index, self) => index === self.findIndex((c) => c.name === color.name)
      );
    }

    return oldColors;
  });

  const [sizes, setSizes] = useState<ProductSize[]>(() => {
    // ...existing code for sizes initialization...
    return [];
  });

  // Helper function to convert variants to new format
  const convertVariantsToNewFormat = () => {
    const variants: any[] = [];

    // Add colors as variants
    colors.forEach((color) => {
      variants.push({
        type: 'color',
        name: color.name,
        jsonData: { hex: color.hex },
      });
    });

    // Add sizes as variants
    sizes.forEach((size) => {
      variants.push({
        type: 'size',
        name: size.name,
        jsonData: { value: size.value || size.name },
      });
    });

    // Add custom variants
    customVariants.forEach((variant) => {
      variants.push({
        type: variant.type,
        name: variant.name,
        jsonData: variant.value ? { value: variant.value } : undefined,
      });
    });

    return variants;
  };

  // Helper function to convert variant combinations to new format
  const convertVariantCombinationsToNewFormat = () => {
    if (!variantCombinations || variantCombinations.length === 0) return [];

    console.log('🔄 Converting variant combinations:', variantCombinations);

    const convertedCombinations = variantCombinations
      .map((combination, index) => {
        // Ensure combination.variants exists and is an array
        if (!combination.variants || !Array.isArray(combination.variants)) {
          console.warn(`Combination ${index} has invalid variants:`, combination);
          return null;
        }

        // Create variant identifiers for each variant in the combination
        const variantIds = combination.variants
          .map((combVariant) => {
            if (!combVariant.type || !combVariant.name) {
              console.warn('Invalid variant in combination:', combVariant);
              return null;
            }
            return `${combVariant.type}:${combVariant.name}`;
          })
          .filter(Boolean); // Remove null values

        const result = {
          variantIds: variantIds,
          stock: combination.stock || 0,
          price: combination.price || formData.price,
        };

        console.log(`✅ Converted combination ${index}:`, result);
        return result;
      })
      .filter(Boolean); // Remove null combinations

    console.log('🎯 Final converted combinations:', convertedCombinations);
    return convertedCombinations;
  };

  // Function to update stocks for existing variant combinations
  const updateVariantCombinationStocks = async (combinationsToUpdate: VariantCombination[]) => {
    if (combinationsToUpdate.length === 0) return;
    try {
      for (const combination of combinationsToUpdate) {
        if (!combination.stockId) continue;
        const input = {
          price: combination.price || formData.price,
          stock: combination.stock,
          available: true,
        };
        await updateStock({
          variables: {
            stockId: combination.stockId,
            input: input,
          },
        });
      }
    } catch (error) {
      console.error('❌ Error updating variant combination stocks:', error);
      throw error;
    }
  };

  // Function to save variant combinations using the new backend API
  const saveVariantCombinations = async (productId: string, createdVariants?: any[]) => {
    if (variantCombinations.length === 0) return;
    try {
      toast.loading('Guardando combinaciones de variantes...', {
        id: 'variant-combinations',
      });

      // For CREATE scenarios, always refetch to get the latest variants
      // For UPDATE scenarios, use existing data first, then refetch if needed
      let allVariants = productVariantsData?.productVariantsByProduct || [];

      // If this is a CREATE scenario (no existing productVariantsData), or if we have createdVariants,
      // we should refetch to get the latest state
      if (!allVariants.length || createdVariants) {
        console.log('🔄 Refetching product variants for accurate state...');
        console.log('🔍 Using productId for refetch:', productId);

        // Add longer delay for CREATE scenarios to ensure DB consistency
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const refetchResult = await refetchProductVariants({ productId });
        allVariants = refetchResult.data?.productVariantsByProduct || [];
        console.log('🔍 Refetch result:', refetchResult.data);
        console.log('🔍 Found variants count:', allVariants.length);
      }

      let allVariantIds = allVariants.map((v: { id: string }) => v.id);
      console.log(
        '🔍 Current variants in database:',
        allVariants.map((v: any) => `${v.type || v.typeVariant}:${v.name || v.nameVariant}`)
      );
      // Separate combinations into new and existing (for updates)
      const combinationsToCreate = variantCombinations.filter(
        (c: VariantCombination) => !c.stockId
      );
      const combinationsToUpdate = variantCombinations.filter(
        (c: VariantCombination) => !!c.stockId
      );
      // Update existing combinations first
      if (combinationsToUpdate.length > 0) {
        await updateVariantCombinationStocks(combinationsToUpdate);
      }
      // --- PREVENT DUPLICATE VARIANT CREATION (CASE-INSENSITIVE) ---
      // Gather all unique variants from combinations to create
      const variantsToCreate: Array<{
        name: string;
        type: string;
        productId: string;
        jsonData?: any;
      }> = [];
      combinationsToCreate.forEach((combination: VariantCombination) => {
        combination.variants.forEach((variant: any) => {
          // Only add if not already in allVariants (case-insensitive type+name)
          const alreadyExists = allVariants.some(
            (v: { type: string; name: string }) =>
              v.type.trim().toLowerCase() === variant.type.trim().toLowerCase() &&
              v.name.trim().toLowerCase() === variant.name.trim().toLowerCase()
          );
          const alreadyInList = variantsToCreate.some(
            (v) =>
              v.type.trim().toLowerCase() === variant.type.trim().toLowerCase() &&
              v.name.trim().toLowerCase() === variant.name.trim().toLowerCase()
          );

          console.log(
            `🔍 Checking variant ${variant.type}:${variant.name} - exists: ${alreadyExists}, inList: ${alreadyInList}`
          );

          if (!alreadyExists && !alreadyInList) {
            console.log(`✅ Adding variant to create: ${variant.type}:${variant.name}`);
            variantsToCreate.push({
              name: variant.name,
              type: variant.type,
              productId: productId,
              jsonData: variant.value ? { value: variant.value } : undefined,
            });
          } else {
            console.log(`⏭️ Skipping existing variant: ${variant.type}:${variant.name}`);
          }
        });
      });
      // Only call createVariants if there are new variants to create
      if (variantsToCreate.length > 0) {
        console.log(`🚀 Creating ${variantsToCreate.length} new variants:`, variantsToCreate);
        await createVariants({ variables: { inputs: variantsToCreate } });
        // Refetch product variants from backend to get latest IDs
        if (productId) {
          await new Promise((resolve) => setTimeout(resolve, 400)); // slight delay for backend consistency
          console.log('🔄 Refetching variants after creation...');
          const refetchResult = await refetchProductVariants({ productId });
          allVariants = refetchResult.data?.productVariantsByProduct || [];
          allVariantIds = allVariants.map((v: { id: string }) => v.id);
        }
      } else {
        console.log('✅ No new variants to create - all variants already exist');
      }

      // Now create combinations (variantIds should exist)
      if (combinationsToCreate.length > 0) {
        for (const combination of combinationsToCreate) {
          // Find the variant IDs that correspond to this combination
          let variantIds: string[] = [];
          if (allVariants.length) {
            variantIds = combination.variants
              .map((variant: any) => {
                const matched = allVariants.find((v: any) => {
                  // Handle both possible field name formats
                  const vType = v.typeVariant || v.type || '';
                  const vName = v.nameVariant || v.name || '';
                  return (
                    vType.trim().toLowerCase() === variant.type.trim().toLowerCase() &&
                    vName.trim().toLowerCase() === variant.name.trim().toLowerCase()
                  );
                });
                if (matched) {
                  console.log(
                    `✅ Found variant match: ${variant.type}:${variant.name} -> ID: ${matched.id}`
                  );
                } else {
                  console.warn(`❌ No variant match found for: ${variant.type}:${variant.name}`);
                  console.log(
                    'Available variants:',
                    allVariants.map(
                      (v: any) => `${v.typeVariant || v.type}:${v.nameVariant || v.name}`
                    )
                  );
                }
                return matched?.id;
              })
              .filter(Boolean);
          }
          if (!variantIds.length && allVariantIds.length) {
            // Fallback: skip this combination
            console.warn(
              '[saveVariantCombinations] Skipping combination with no variantIds:',
              combination
            );
            console.warn('Available variant IDs:', allVariantIds);
            console.warn('Combination variants:', combination.variants);
            continue;
          }

          console.log(
            `🔗 Creating combination with variantIds: [${variantIds.join(', ')}] for variants:`,
            combination.variants.map((v: any) => `${v.type}:${v.name}`)
          );

          // Actually create the combination
          await createVariantCombination({
            variables: {
              input: {
                productId,
                variantIds,
                price: combination.price || formData.price,
                stock: combination.stock,
              },
            },
          });
        }
      }
    } catch (error) {
      console.error('Error saving variant combinations:', error);
      toast.error('Error al guardar combinaciones de variantes');
      throw error;
    }
  };
  // Navigation helpers
  const prevStep = () => {
    const idx = steps.findIndex((s) => s.id === currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };
  const nextStep = () => {
    const idx = steps.findIndex((s) => s.id === currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
  };

  // Function to upload images to the server
  const uploadImages = async (imagesToUpload: ProductImage[]): Promise<ProductImage[]> => {
    if (imagesToUpload.length === 0) return [];

    setIsUploadingImages(true);
    toast.loading('Subiendo imágenes...', { id: 'image-upload' });

    const uploadedImages: ProductImage[] = [];

    try {
      for (const image of imagesToUpload) {
        // Skip images that already have URLs (already uploaded)
        if (image.url && !image.url.startsWith('blob:')) {
          uploadedImages.push(image);
          continue;
        }

        try {
          // Convert blob URL to file for upload
          const response = await fetch(image.url);
          const blob = await response.blob();

          const formData = new FormData();
          formData.append('images', blob, image.alt || 'product-image.jpg');
          // Add the business name as folder parameter (directly in uploads folder)
          if (store?.name) {
            formData.append('folderName', store.name.replace(/[^a-zA-Z0-9-_]/g, '_'));
          }

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/images`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();

          // Assuming the API returns { urls: ['url1', 'url2', ...] } or { url: 'single-url' }
          const uploadedUrl = uploadResult[0]?.key || uploadResult.url;

          if (uploadedUrl) {
            uploadedImages.push({
              ...image,
              url: uploadedUrl,
            });
          } else {
            throw new Error('No URL returned from upload');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          throw new Error(`Failed to upload image: ${image.alt || 'Unknown'}`);
        }
      }

      toast.success('Imágenes subidas exitosamente', { id: 'image-upload' });
      return uploadedImages;
    } catch (error) {
      toast.error('Error al subir imágenes', { id: 'image-upload' });
      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!store?.id) return;

    // Validate all required steps
    const requiredSteps = steps.filter((s) => s.required);
    for (const step of requiredSteps) {
      if (!validateStep(step.id)) {
        setCurrentStep(step.id);
        toast.error(`Por favor completa el paso: ${step.title}`);
        return;
      }
    }

    const isLoading = loading || isSaving;
    if (isLoading) return;

    setIsSaving(true);
    try {
      // Upload images before saving the product
      const uploadedImages = await uploadImages(images);

      if (product?.id) {
        // UPDATE EXISTING PRODUCT
        const updateInput = {
          name: formData.name,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          available: formData.available,
          inStock: formData.inStock,
          stock: effectiveStock,
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          })),
          images: uploadedImages.map((img, index) => ({
            url: img.url,
            order: index,
          })),
          colors: colors.map((color) => ({
            color: color.name,
            colorHex: color.hex,
          })),
          sizes: sizes.map((size) => size.name),
        };

        console.log('🔍 UPDATE Input being sent:', {
          colors: updateInput.colors,
          sizes: updateInput.sizes,
          customVariants: customVariants,
          stock: updateInput.stock,
        });

        const { data } = await updateProduct({
          variables: {
            id: product.id,
            input: updateInput,
          },
        });

        if (data.updateProduct) {
          // Save variant combinations after product update
          if (variantCombinations.length > 0) {
            await saveVariantCombinations(product.id, data.updateProduct.variants);
          }

          toast.success('¡Producto actualizado exitosamente! 🎉');
          onCancel(); // Close the form
        } else {
          throw new Error('No se pudo actualizar el producto');
        }
      } else {
        // CREATE NEW PRODUCT
        const createInput = {
          name: formData.name,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          storeId: store?.id,
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          })),
          images: uploadedImages.map((img, index) => ({
            url: img.url,
            order: index + 1,
          })),
          // Keep legacy color/size fields for backward compatibility
          colors: colors.map((color) => ({
            color: color.name,
            colorHex: color.hex,
          })),
          sizes: sizes.map((size) => size.name),
          // New variant fields
          variants: convertVariantsToNewFormat(),
          // Temporarily remove variant combinations to test
          // variantCombinations: convertVariantCombinationsToNewFormat(),
          inStock: formData.inStock,
          stock: effectiveStock,
        };

        console.log('🔍 CREATE Input being sent:', {
          colors: createInput.colors,
          sizes: createInput.sizes,
          variants: createInput.variants,
          // variantCombinations: createInput.variantCombinations,
          stock: createInput.stock,
        });

        console.log('🔍 Raw variantCombinations before conversion:', variantCombinations);
        console.log('🔍 Colors array:', colors);
        console.log('🔍 Sizes array:', sizes);
        console.log('🔍 Custom variants array:', customVariants);
        console.log('🔍 Converted variantCombinations:', convertVariantCombinationsToNewFormat());

        const { data } = await createProductWithUrls({
          variables: { input: createInput },
        });

        if (data.createProductWithUrls) {
          const newProductId = data.createProductWithUrls.id;

          console.log('🎉 Product created successfully!');
          console.log('📋 Backend response variants:', data.createProductWithUrls.variants);

          // Save variant combinations after product creation (use same approach as UPDATE)
          if (variantCombinations.length > 0) {
            await saveVariantCombinations(
              newProductId,
              undefined // No variants returned from backend, will refetch
            );
          }

          toast.success('¡Producto creado exitosamente! 🎉');
          // Reset form
          setFormData({
            name: '',
            title: '',
            description: '',
            price: 0,
            currency: 'COP',
            available: true,
            inStock: true,
          });
          setImages([]);
          setColors([]);
          setSizes([]);
          setCategories([]);
          setCustomVariants([]);
          setVariantCombinations([]);
          setCompletedSteps(new Set());
          setCurrentStep('basic');
          onCancel(); // Close the form
        } else {
          throw new Error('No se pudo crear el producto');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  // Function to generate AI description with typewriter effect
  const generateAIDescription = async () => {
    if (!formData.name || !formData.title) {
      toast.error('Por favor completa el nombre y título del producto primero');
      return;
    }

    try {
      toast.loading('Generando descripción con IA...', {
        id: 'ai-description',
      });

      const requestBody = {
        title: formData.title,
        categories: categories.map((cat) => cat.name),
        colors: colors.map((color) => color.name),
        sizes: sizes.map((size) => size.name),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbot/create-product-description`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.description) {
        // Clear the current description first
        setFormData((prev) => ({ ...prev, description: '' }));

        toast.success('¡Descripción generada exitosamente! ✨', {
          id: 'ai-description',
        });

        // Typewriter effect implementation
        const fullDescription = result.description;
        const words = fullDescription.split(' ');
        let currentText = '';
        let wordIndex = 0;

        const typeWriterInterval = setInterval(() => {
          if (wordIndex < words.length) {
            currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
            setFormData((prev) => ({ ...prev, description: currentText }));
            wordIndex++;
          } else {
            clearInterval(typeWriterInterval);
          }
        }, 80); // Velocidad de escritura: 80ms por palabra (ajustable)
      } else {
        throw new Error('No se recibió descripción del servidor');
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al generar descripción con IA';
      toast.error(errorMessage, { id: 'ai-description' });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Información Básica</h3>
              <p className="text-gray-400 mt-2">Cuéntanos sobre tu producto</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="ej: Camiseta Polo Premium"
                />
                {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título del Producto *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                    errors.title ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="ej: Camiseta Polo Premium de Algodón 100%"
                />
                {errors.title && <p className="text-red-400 text-sm mt-2">{errors.title}</p>}
              </div>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Precio e Inventario</h3>
              <p className="text-gray-400 mt-2">Define el precio y disponibilidad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Precio *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string, otherwise parse as number
                    if (value === '') {
                      handleInputChange('price', 0);
                    } else {
                      const numValue = parseFloat(value);
                      handleInputChange('price', isNaN(numValue) ? 0 : numValue);
                    }
                  }}
                  placeholder="0"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                    errors.price ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.price && <p className="text-red-400 text-sm mt-2">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Moneda</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                >
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
              <h4 className="font-medium text-white mb-4">Disponibilidad</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => handleInputChange('available', e.target.checked)}
                    className="w-4 h-4 text-slate-500 focus:ring-slate-500 border-gray-600 rounded bg-gray-700"
                  />
                  <span className="ml-3 text-sm text-gray-300">
                    Producto disponible para la venta
                  </span>
                </label>

                {variantCombinations.length > 0 && (
                  <div className="bg-blue-900 border border-blue-800 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Package className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-300">
                        Stock Total: {effectiveStock} unidades
                      </span>
                    </div>
                    <p className="text-xs text-blue-400">
                      Calculado automáticamente desde {variantCombinations.length} variante
                      {variantCombinations.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Tag className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Categorías</h3>
              <p className="text-gray-400 mt-2">
                Clasifica tu producto para que sea fácil de encontrar
              </p>
            </div>

            <CategorySelector selectedCategories={categories} onChange={setCategories} />
            {errors.categories && <p className="text-red-400 text-sm">{errors.categories}</p>}
          </div>
        );

      case 'images':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Image className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Imágenes y Variantes</h3>
              <p className="text-gray-400 mt-2">Sube fotos de tu producto y define sus variantes</p>
            </div>

            {/* Images Section */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Imágenes del Producto
                </h4>
                <ImageUploader images={images} onChange={setImages} />
                {errors.images && <p className="text-red-400 text-sm mt-2">{errors.images}</p>}

                <div className="bg-slate-700 border border-blue-800 p-4 rounded-xl mt-4">
                  <h5 className="text-sm font-medium text-white mb-2">
                    💡 Consejos para mejores fotos:
                  </h5>
                  <ul className="text-sm text-white space-y-1">
                    <li>• Usa buena iluminación natural</li>
                    <li>• Incluye diferentes ángulos del producto</li>
                    <li>• Muestra el producto en uso si es posible</li>
                    <li>• Mantén el fondo limpio y simple</li>
                  </ul>
                </div>
              </div>

              {/* Variants Section */}
              <div className="border-t border-gray-700 pt-8">
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Variantes del Producto
                  <span className="ml-2 text-sm font-normal text-gray-400">(Opcional)</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                  {/* Colors */}
                  <div>
                    <h5 className="text-md font-medium text-gray-300 mb-4 flex items-center">
                      <Palette className="w-4 h-4 mr-2" />
                      Colores
                    </h5>
                    <ColorPicker colors={colors} onChange={setColors} />
                  </div>

                  {/* Sizes */}
                  <div>
                    <h5 className="text-md font-medium text-gray-300 mb-4 flex items-center">
                      <Ruler className="w-4 h-4 mr-2" />
                      Tallas
                    </h5>
                    <SizeSelector sizes={sizes} onChange={setSizes} />
                  </div>

                  {/* Custom Variants */}
                  <div>
                    <CustomVariantSelector variants={customVariants} onChange={setCustomVariants} />
                  </div>

                  {/* Variant Combinations */}
                  <div className="mt-8 pt-8 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">Combinaciones de Variantes</h3>
                    </div>

                    {/* Stock Calculation Info */}
                    <div className="bg-amber-900 border border-amber-800 p-4 rounded-xl mb-6">
                      <div className="flex items-start">
                        <Info className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h5 className="text-sm font-medium text-amber-300 mb-2">
                            ℹ️ Cálculo Automático de Stock
                          </h5>
                          <div className="text-sm text-amber-400 space-y-1">
                            <p>
                              • El stock total del producto se calcula automáticamente sumando el
                              stock de todas las variantes
                            </p>
                            <p>• Cada combinación de variantes tendrá su propio stock individual</p>
                            <p>
                              • El stock total se mostrará en la sección &quot;Disponibilidad&quot;
                              cuando tengas variantes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingCombinations && product?.id ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-3" />
                        <span className="text-gray-400">Cargando combinaciones existentes...</span>
                      </div>
                    ) : (
                      <VariantCombinationGenerator
                        colors={colors}
                        sizes={sizes}
                        customVariants={customVariants}
                        onCombinationsChange={setVariantCombinations}
                        existingCombinations={variantCombinations}
                        isEditMode={!!product?.id}
                        basePrice={formData.price} // Pass the base price from the form
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'description':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Descripción *</label>
              {/* AI Generate Button */}
              <button
                type="button"
                onClick={generateAIDescription}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-500 hover:from-slate-600 hover:to-slate-400 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generar Descripción IA
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                errors.description ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Describe las características, materiales, y beneficios de tu producto..."
            />

            {errors.description && (
              <p className="text-red-400 text-sm mt-2">{errors.description}</p>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Revisar Producto</h3>
              <p className="text-gray-400 mt-2">Verifica que toda la información sea correcta</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              {/* Product preview */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-start space-x-4">
                  {images.length > 0 && (
                    <img
                      src={
                        images[0].url.startsWith('blob:')
                          ? images[0].url
                          : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${images[0].url}`
                      }
                      alt={formData.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">{formData.name}</h4>
                    <p className="text-gray-400">{formData.title}</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">
                      ${formData.price.toLocaleString()} {formData.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div>
                  <h5 className="font-medium text-white">Descripción:</h5>
                  <p className="text-gray-400 text-sm mt-1">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-white">Stock:</h5>
                    <p className="text-gray-400 text-sm">
                      {effectiveStock} unidades
                      {variantCombinations.length > 0 && (
                        <span className="text-xs text-blue-400 block">
                          (Suma de {variantCombinations.length} variante
                          {variantCombinations.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-white">Estado:</h5>
                    <p className="text-gray-400 text-sm">
                      {formData.available ? 'Disponible' : 'No disponible'} •{' '}
                      {formData.inStock ? 'En stock' : 'Sin stock'}
                    </p>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div>
                    <h5 className="font-medium text-white">Categorías:</h5>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {colors.length > 0 && (
                  <div>
                    <h5 className="font-medium text-white">Colores:</h5>
                    <div className="flex space-x-2 mt-1">
                      {colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded-full border border-gray-600"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div>
                    <h5 className="font-medium text-white">Tallas:</h5>
                    <div className="flex space-x-2 mt-1">
                      {sizes.map((size, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded border border-gray-600"
                        >
                          {size.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {variantCombinations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-white">Stock por Variante:</h5>
                    <div className="mt-2 space-y-1">
                      {variantCombinations.map((combination) => (
                        <div
                          key={combination.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-400">{combination.name}:</span>
                          <span className="font-medium text-white">
                            {combination.stock} unidades
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-sm font-medium border-t border-gray-700 pt-1 mt-2">
                        <span className="text-white">Total:</span>
                        <span className="text-white">
                          {variantCombinations.reduce((sum, c) => sum + c.stock, 0)} unidades
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900 rounded-lg">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {product ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h1>
                <p className="text-gray-400 mt-1 text-sm md:text-base">
                  Sigue los pasos para {product ? 'actualizar' : 'crear'} tu producto
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 md:px-4 py-2 border border-gray-600 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
            >
              <span className="hidden sm:inline">Cancelar</span>
              <span className="sm:hidden">✕</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-4 md:p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between overflow-x-auto gap-2 md:gap-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id) || isStepCompleted(step.id);
              // Minimal change: allow all steps to be clickable if editing (product exists)
              const isClickable =
                !!product ||
                index === 0 ||
                completedSteps.has(steps[index - 1]?.id) ||
                isStepCompleted(steps[index - 1]?.id);

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer group min-w-0 flex-1 relative ${
                    isClickable ? '' : 'cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => isClickable && goToStep(step.id)}
                >
                  <div
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'border-slate-500 bg-slate-500 text-white shadow-lg'
                        : isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-600 bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle className="w-4 h-4 md:w-6 md:h-6" />
                    ) : (
                      <div className="w-3 h-3 md:w-5 md:h-5">{step.icon}</div>
                    )}
                  </div>
                  <div className="mt-1 md:mt-2 text-center flex flex-col items-center w-full">
                    <p
                      className={`text-xs md:text-sm font-medium hidden  md:block ${
                        isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 hidden lg:block truncate max-w-20">
                      {step.description}
                    </p>
                  </div>

                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div
                      className="hidden md:block absolute h-0.5 bg-gray-600 -z-10"
                      style={{
                        top: '24px',
                        left: 'calc(50% + 24px)',
                        right: 'calc(-50% + 24px)',
                      }}
                    >
                      <div
                        className={`h-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}`}
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 md:p-8 bg-gray-900">
          <div className="transition-all duration-300 ease-in-out">{renderStep()}</div>
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-700 p-4 md:p-6 bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 'basic'}
              className="flex items-center px-4 py-2 border border-gray-600 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {steps.findIndex((s) => s.id === currentStep) + 1} de {steps.length}
              </span>
            </div>

            <div className="flex space-x-3">
              {currentStep === 'review' ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading || isSaving || isUploadingImages}
                  className="text-white px-6 md:px-8 py-2 md:py-3 rounded-lg disabled:opacity-50 flex items-center transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: store?.primaryColor || '#2563eb',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = store?.primaryColor || '#1e293b';
                    e.currentTarget.style.opacity = '0.8';
                  }}
                >
                  {loading || isSaving || isUploadingImages ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span className="hidden sm:inline">
                        {isUploadingImages
                          ? 'Subiendo imágenes...'
                          : product
                            ? 'Actualizando...'
                            : 'Creando...'}
                      </span>
                      <span className="sm:hidden">
                        {isUploadingImages
                          ? 'Subiendo...'
                          : product
                            ? 'Actualizando...'
                            : 'Creando...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        {product ? 'Actualizar' : 'Crear'} Producto
                      </span>
                      <span className="sm:hidden">{product ? 'Actualizar' : 'Crear'}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={steps.findIndex((s) => s.id === currentStep) === steps.length - 1}
                  className="flex items-center px-4 md:px-6 py-2 text-white rounded-lg transition-colors hover:shadow-lg bg-slate-700 hover:bg-slate-600"
                >
                  <span className="hidden sm:inline">Siguiente </span>
                  <span className="sm:hidden">Sig.</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="mt-4 bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}
    </div>
  );
}
