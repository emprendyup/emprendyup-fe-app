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
  Check,
  ChevronDown,
  X,
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
      parentId
      parent {
        id
        name
        slug
      }
      children {
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

interface CustomVariant {
  id: string;
  type: string;
  name: string;
  value: string;
}

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
  stockId?: string;
}

export function ProductFormWizard({
  product,
  onSave,
  onCancel,
  loading = false,
}: ProductFormWizardProps) {
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
      const mappedCategories = (product.categories || []).map((cat: any) => {
        const c = cat.category || cat;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || '',
        };
      });
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
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const { data, error } = useQuery(GET_STORE_CONFIG, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId,
  });
  const store = data?.store;

  const [currentStep, setCurrentStep] = useState<StepType>('basic');

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

  function validateStep(stepId: StepType): boolean {
    return true;
  }

  function isStepCompleted(stepId: StepType): boolean {
    return completedSteps.has(stepId);
  }

  function goToStep(stepId: StepType) {
    setCurrentStep(stepId);
  }

  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set());
  const [loadingCombinations, setLoadingCombinations] = useState(false);

  const [createProductWithUrls] = useMutation(CREATE_PRODUCT_WITH_URLS);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [createVariantCombination] = useMutation(CREATE_VARIANT_COMBINATION);
  const [updateStock] = useMutation(UPDATE_STOCK);
  const [createVariants] = useMutation(CREATE_VARIANTS);

  const { data: variantCombinationsData } = useQuery(GET_VARIANT_COMBINATIONS, {
    variables: { productId: product?.id || '' },
    skip: !product?.id,
    fetchPolicy: 'cache-and-network',
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery(GET_CATEGORIES_BY_STORE, {
    variables: { storeId: userData?.storeId },
    skip: !userData?.storeId,
  });

  const { data: productVariantsData, refetch: refetchProductVariants } = useQuery(
    GET_PRODUCT_VARIANTS,
    {
      variables: { productId: product?.id || '' },
      skip: !product?.id,
      fetchPolicy: 'cache-and-network',
    }
  );

  useEffect(() => {
    if (productVariantsData && productVariantsData.productVariantsByProduct) {
      const allVariants = productVariantsData.productVariantsByProduct;

      setColors(
        allVariants
          .filter((v: { type: string }) => v.type?.toLowerCase() === 'color')
          .map((v: { id: any; name: any; jsonData: { hex: any; color: any } }) => ({
            id: v.id,
            name: v.name,
            hex: v.jsonData?.hex || v.jsonData?.color || '#000000',
          }))
      );

      setSizes(
        allVariants
          .filter((v: { type: string }) => v.type?.toLowerCase() === 'size')
          .map((v: { id: any; name: any; jsonData: { value: any } }) => ({
            id: v.id,
            name: v.name,
            value: v.jsonData?.value || v.name,
          }))
      );

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

  const [formData, setFormData] = useState({
    name: product?.name || '',
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    currency: product?.currency || 'COP',
    available: product?.available ?? true,
    inStock: product?.inStock ?? true,
  });

  const calculateTotalStock = (): number => {
    if (variantCombinations.length === 0) {
      return 0;
    }
    return variantCombinations.reduce((total, combination) => total + (combination.stock || 0), 0);
  };

  const effectiveStock = calculateTotalStock();

  useEffect(() => {
    if (variantCombinations.length > 0) {
      const calculatedStock = variantCombinations.reduce(
        (total, combination) => total + (combination.stock || 0),
        0
      );
      setFormData((prev) => ({
        ...prev,
        inStock: calculatedStock > 0,
      }));
    }
  }, [variantCombinations]);

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

  const [colors, setColors] = useState<ProductColor[]>(() => {
    const oldColors =
      product?.colors?.map((color: any) => ({
        id: color.id,
        name: color.color || color.name || '',
        hex: color.colorHex || color.hex || '#000000',
      })) || [];

    if (product?.variants && product.variants.length > 0) {
      const variantColors = variantsToColors(product.variants);
      const mergedColors = [...oldColors, ...variantColors];
      return mergedColors.filter(
        (color, index, self) => index === self.findIndex((c) => c.name === color.name)
      );
    }

    return oldColors;
  });

  const [sizes, setSizes] = useState<ProductSize[]>(() => {
    return [];
  });

  const convertVariantsToNewFormat = () => {
    const variants: any[] = [];

    colors.forEach((color) => {
      variants.push({
        type: 'color',
        name: color.name,
        jsonData: { hex: color.hex },
      });
    });

    sizes.forEach((size) => {
      variants.push({
        type: 'size',
        name: size.name,
        jsonData: { value: size.value || size.name },
      });
    });

    customVariants.forEach((variant) => {
      variants.push({
        type: variant.type,
        name: variant.name,
        jsonData: variant.value ? { value: variant.value } : undefined,
      });
    });

    return variants;
  };

  const convertVariantCombinationsToNewFormat = () => {
    if (!variantCombinations || variantCombinations.length === 0) return [];

    console.log('🔄 Converting variant combinations:', variantCombinations);

    const convertedCombinations = variantCombinations
      .map((combination, index) => {
        if (!combination.variants || !Array.isArray(combination.variants)) {
          console.warn(`Combination ${index} has invalid variants:`, combination);
          return null;
        }

        const variantIds = combination.variants
          .map((combVariant) => {
            if (!combVariant.type || !combVariant.name) {
              console.warn('Invalid variant in combination:', combVariant);
              return null;
            }
            return `${combVariant.type}:${combVariant.name}`;
          })
          .filter(Boolean);

        const result = {
          variantIds: variantIds,
          stock: combination.stock || 0,
          price: combination.price || formData.price,
        };

        console.log(`✅ Converted combination ${index}:`, result);
        return result;
      })
      .filter(Boolean);

    console.log('🎯 Final converted combinations:', convertedCombinations);
    return convertedCombinations;
  };

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

  const saveVariantCombinations = async (productId: string, createdVariants?: any[]) => {
    if (variantCombinations.length === 0) return;
    try {
      toast.loading('Guardando combinaciones de variantes...', {
        id: 'variant-combinations',
      });

      let allVariants = productVariantsData?.productVariantsByProduct || [];

      if (!allVariants.length || createdVariants) {
        console.log('🔄 Refetching product variants for accurate state...');
        console.log('🔍 Using productId for refetch:', productId);

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

      const combinationsToCreate = variantCombinations.filter(
        (c: VariantCombination) => !c.stockId
      );
      const combinationsToUpdate = variantCombinations.filter(
        (c: VariantCombination) => !!c.stockId
      );

      if (combinationsToUpdate.length > 0) {
        await updateVariantCombinationStocks(combinationsToUpdate);
      }

      const variantsToCreate: Array<{
        name: string;
        type: string;
        productId: string;
        jsonData?: any;
      }> = [];

      combinationsToCreate.forEach((combination: VariantCombination) => {
        combination.variants.forEach((variant: any) => {
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

      if (variantsToCreate.length > 0) {
        console.log(`🚀 Creating ${variantsToCreate.length} new variants:`, variantsToCreate);
        await createVariants({ variables: { inputs: variantsToCreate } });

        if (productId) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          console.log('🔄 Refetching variants after creation...');
          const refetchResult = await refetchProductVariants({ productId });
          allVariants = refetchResult.data?.productVariantsByProduct || [];
          allVariantIds = allVariants.map((v: { id: string }) => v.id);
        }
      } else {
        console.log('✅ No new variants to create - all variants already exist');
      }

      if (combinationsToCreate.length > 0) {
        for (const combination of combinationsToCreate) {
          let variantIds: string[] = [];
          if (allVariants.length) {
            variantIds = combination.variants
              .map((variant: any) => {
                const matched = allVariants.find((v: any) => {
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

  const prevStep = () => {
    const idx = steps.findIndex((s) => s.id === currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };

  const nextStep = () => {
    const idx = steps.findIndex((s) => s.id === currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
  };

  const uploadImages = async (imagesToUpload: ProductImage[]): Promise<ProductImage[]> => {
    if (imagesToUpload.length === 0) return [];

    setIsUploadingImages(true);
    toast.loading('Subiendo imágenes...', { id: 'image-upload' });

    const uploadedImages: ProductImage[] = [];

    try {
      for (const image of imagesToUpload) {
        if (image.url && !image.url.startsWith('blob:')) {
          uploadedImages.push(image);
          continue;
        }

        try {
          const response = await fetch(image.url);
          const blob = await response.blob();

          const formData = new FormData();
          formData.append('images', blob, image.alt || 'product-image.jpg');
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
      const uploadedImages = await uploadImages(images);

      if (product?.id) {
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
          if (variantCombinations.length > 0) {
            await saveVariantCombinations(product.id, data.updateProduct.variants);
          }

          toast.success('¡Producto actualizado exitosamente! 🎉');
          onCancel();
        } else {
          throw new Error('No se pudo actualizar el producto');
        }
      } else {
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
          colors: colors.map((color) => ({
            color: color.name,
            colorHex: color.hex,
          })),
          sizes: sizes.map((size) => size.name),
          variants: convertVariantsToNewFormat(),
          inStock: formData.inStock,
          stock: effectiveStock,
        };

        console.log('🔍 CREATE Input being sent:', {
          colors: createInput.colors,
          sizes: createInput.sizes,
          variants: createInput.variants,
          stock: createInput.stock,
        });

        const { data } = await createProductWithUrls({
          variables: { input: createInput },
        });

        if (data.createProductWithUrls) {
          const newProductId = data.createProductWithUrls.id;

          console.log('🎉 Product created successfully!');
          console.log('📋 Backend response variants:', data.createProductWithUrls.variants);

          if (variantCombinations.length > 0) {
            await saveVariantCombinations(newProductId, undefined);
          }

          toast.success('¡Producto creado exitosamente! 🎉');
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
          onCancel();
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
        setFormData((prev) => ({ ...prev, description: '' }));

        toast.success('¡Descripción generada exitosamente! ✨', {
          id: 'ai-description',
        });

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
        }, 80);
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

  // Transform backend categories to structured format with parent/children relationships
  const transformedCategories = categoriesData?.categoriesByStore
    ? categoriesData.categoriesByStore.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        order: cat.order,
        parentId: cat.parentId,
        parent: cat.parent,
        children: cat.children,
      }))
    : [];
  const handleSelectCategory = (catId: any, catName: any, catSlug: any, isParent = false) => {
    if (!categories.find((c) => c.id === catId)) {
      setCategories([...categories, { id: catId, name: catName, slug: catSlug }]);
    }
    if (isParent) setIsOpen(false);
  };

  const handleRemoveCategory = (catId: any) => {
    setCategories(categories.filter((c) => c.id !== catId));
  };

  const selectedCategoryNames = categories.map((c) => c.name).join(', ');
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
          <div className="space-y-6 w-full ">
            <div className="text-center mb-8">
              <Tag className="w-12 h-12 text-fourth-base mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Categorías</h3>
              <p className="text-gray-400 mt-2">
                Clasifica tu producto para que sea fácil de encontrar
              </p>
            </div>

            {transformedCategories && transformedCategories.length > 0 ? (
              <div className="space-y-8">
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 hover:border-fourth-400 text-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-fourth-400 transition-all duration-200 flex items-center justify-between group"
                  >
                    <span className="text-left">
                      {categories.length > 0
                        ? `${categories.length} categoría${categories.length > 1 ? 's' : ''} seleccionada${categories.length > 1 ? 's' : ''}`
                        : 'Selecciona una categoría'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-fourth-base transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-fourth-400/50 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
                      {transformedCategories.map((category: any) => (
                        <div key={category.id}>
                          {/* Parent Category */}
                          <button
                            onClick={() =>
                              handleSelectCategory(category.id, category.name, category.slug, true)
                            }
                            className={`w-full text-left px-4 py-3 hover:bg-fourth-400/10 text-white font-medium transition-colors border-b border-gray-700 last:border-b-0 flex items-center gap-3 ${
                              categories.some((c) => c.id === category.id)
                                ? 'bg-fourth-400/20 text-fourth-200'
                                : ''
                            }`}
                          >
                            <span className="text-fourth-base">◆</span>
                            <span>{category.name}</span>
                            {categories.some((c) => c.id === category.id) && (
                              <span className="ml-auto text-green-400 font-semibold">✓</span>
                            )}
                          </button>

                          {/* Child Categories */}
                          {category.children &&
                            category.children.map((child: any) => (
                              <button
                                key={child.id}
                                onClick={() =>
                                  handleSelectCategory(child.id, child.name, child.slug)
                                }
                                className={`w-full text-left px-8 py-2.5 hover:bg-gray-700 text-gray-300 hover:text-fourth-base transition-colors text-sm flex items-center ${
                                  categories.some((c) => c.id === child.id)
                                    ? 'bg-gray-700 text-fourth-200'
                                    : ''
                                }`}
                              >
                                <span className="mr-2">└─</span>
                                <span className="truncate">{child.name}</span>
                                {categories.some((c) => c.id === child.id) && (
                                  <span className="ml-auto text-green-400">✓</span>
                                )}
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Categories Tags */}
                {categories.length > 0 && (
                  <div className="bg-gradient-to-r from-fourth-900/30 to-fourth-800/20 border border-fourth-600/50 p-4 rounded-lg backdrop-blur-sm">
                    <p className="text-fourth-300 text-sm font-medium mb-3">
                      Categorías seleccionadas: {categories.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="px-3 py-1.5 bg-fourth-400 text-white text-xs rounded-full flex items-center gap-2 hover:bg-fourth-600 transition-colors group"
                        >
                          {cat.name}
                          <button
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="opacity-0 text-white group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-400">No hay categorías disponibles</p>
              </div>
            )}

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

              <div className="border-t border-gray-700 pt-8">
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Variantes del Producto
                  <span className="ml-2 text-sm font-normal text-gray-400">(Opcional)</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                  <div>
                    <h5 className="text-md font-medium text-gray-300 mb-4 flex items-center">
                      <Palette className="w-4 h-4 mr-2" />
                      Colores
                    </h5>
                    <ColorPicker colors={colors} onChange={setColors} />
                  </div>

                  <div>
                    <h5 className="text-md font-medium text-gray-300 mb-4 flex items-center">
                      <Ruler className="w-4 h-4 mr-2" />
                      Tallas
                    </h5>
                    <SizeSelector sizes={sizes} onChange={setSizes} />
                  </div>

                  <div>
                    <CustomVariantSelector variants={customVariants} onChange={setCustomVariants} />
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">Combinaciones de Variantes</h3>
                    </div>

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
                        basePrice={formData.price}
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

        <div className="p-4 md:p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between overflow-x-auto gap-2 md:gap-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id) || isStepCompleted(step.id);
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
                      className={`text-xs md:text-sm font-medium hidden md:block ${
                        isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 hidden lg:block truncate max-w-20">
                      {step.description}
                    </p>
                  </div>

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

        <div className="p-4 md:p-8 bg-gray-900">
          <div className="transition-all duration-300 ease-in-out">{renderStep()}</div>
        </div>

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

      {errors.submit && (
        <div className="mt-4 bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}
    </div>
  );
}
