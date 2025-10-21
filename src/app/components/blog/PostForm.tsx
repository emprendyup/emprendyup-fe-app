'use client';

import { useEffect, useState, useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { blogApi, BlogPost } from '@/lib/blog/blog.api';
import { generateSlug } from '@/lib/blog/slug';
import { BlogPostSchema } from '@/lib/blog/validation';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import useDebounce from '../../../lib/hooks/useDebounce';
import { Upload, X, Eye, EyeOff, Save, Send, ArrowLeft, ImageIcon, Plus } from 'lucide-react';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';
import { SlUmbrella } from 'react-icons/sl';
import FileUpload from '../FileUpload';

interface PostFormProps {
  initialData?: Partial<BlogPost>;
}

export default function PostForm({ initialData }: PostFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    slug: '',
    content: '',
    coverImageUrl: '',
    blogCategoryId: '',
    tagIds: [] as string[],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [contentHtml, setContentHtml] = useState<string>(initialData?.content || '');
  const [relatedQuery, setRelatedQuery] = useState('');
  const [relatedSuggestions, setRelatedSuggestions] = useState<BlogPost[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [restored, setRestored] = useState(false);
  const autosaveTimer = useRef<number | null>(null);
  const debouncedRelated = useDebounce(relatedQuery, 300);
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);
  const user = getUserFromLocalStorage();
  const autosaveKey = `blog-draft:${initialData?.id ?? 'new'}`;

  const CREATE_POST = gql`
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        title
        excerpt
        content
        coverImageUrl
        blogCategoryId
        status
        createdAt
        tags {
          tag {
            id
          }
        }
        slug
        creator {
          id
          name
          email
        }
        __typename
      }
    }
  `;

  const UPDATE_POST = gql`
    mutation UpdatePost($input: UpdatePostInput!) {
      updatePost(input: $input) {
        id
        title
        slug
        excerpt
        content
        coverImageUrl
        blogCategoryId
        status
        updatedAt
        tags {
          tag {
            id
          }
        }
      }
    }
  `;

  const [createPostMutation] = useMutation(CREATE_POST);
  const [updatePostMutation] = useMutation(UPDATE_POST);

  // Auto-generate slug when leaving title field
  const handleTitleBlur = () => {
    if (!formData.slug && formData.title) {
      const slug = generateSlug(formData.title!);
      setFormData((prev) => ({ ...prev, slug }));
      // Pre-validate uniqueness
      (async () => {
        try {
          const existing = await blogApi.getPostBySlug(slug);
          if (existing && existing.id !== initialData?.id) {
            setMessage('El slug ya existe. Modifícalo para que sea único.');
            setMessageType('error');
          }
        } catch (err) {
          // Not found => OK
        }
      })();
    }
  };
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        excerpt: initialData.excerpt || '',
        slug: initialData.slug || '',
        content: initialData.content || '',
        coverImageUrl: initialData.coverImageUrl || '',
        blogCategoryId: initialData.blogCategory?.name || '',
        tagIds: initialData.tags?.map((t) => t.tag.id) || [],
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Enhanced Rich Text Editor wrapper
  const rteRef = useRef<RichTextEditorRef | null>(null);

  const handleEditorChange = (html: string) => {
    setContentHtml(html);
  };

  // Related posts suggestions
  useEffect(() => {
    if (!debouncedRelated || debouncedRelated.length < 2) {
      setRelatedSuggestions([]);
      return;
    }
    (async () => {
      try {
        const res = await blogApi.searchPosts(debouncedRelated);
        setRelatedSuggestions(res || []);
      } catch (e) {
        setRelatedSuggestions([]);
      }
    })();
  }, [debouncedRelated]);

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    try {
      setIsSaving(true);
      setMessage(null);

      if (!formData.title.trim()) {
        setMessage('Título requerido');
        setMessageType('error');
        setIsSaving(false);
        return;
      }

      // Validation with zod
      const parsed = BlogPostSchema.parse({
        ...formData,
        creatorId: user?.id,
        content: contentHtml || formData.content,
        status,
      });

      let saved: BlogPost;
      if (isEdit && initialData?.id) {
        const res = await updatePostMutation({
          variables: { input: { id: initialData.id, ...parsed } },
        });
        saved = res?.data?.updatePost;
        setMessage('Artículo actualizado correctamente');
      } else {
        const res = await createPostMutation({ variables: { input: parsed } });
        saved = res?.data?.createPost;
        setMessage(
          status === 'DRAFT' ? 'Borrador guardado correctamente' : 'Artículo publicado exitosamente'
        );
      }

      setMessageType('success');
      router.push(`/blog-detalle/${saved.slug}`);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error al guardar. Intenta nuevamente.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/blog')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit ? 'Editar artículo' : 'Nuevo artículo'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {isEdit ? 'Modifica tu contenido' : 'Crea contenido increíble'}
              </p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              messageType === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : messageType === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            <p className="font-medium">{message}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Título del artículo</label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              onBlur={handleTitleBlur}
              placeholder="Escribe un título atractivo..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">URL slug</label>
            <div className="flex items-center">
              <span className="px-3 py-3 bg-gray-800 border border-r-0 border-gray-600 rounded-l-xl text-gray-400 text-sm">
                /blog/
              </span>
              <input
                type="text"
                name="slug"
                value={formData.slug || ''}
                onChange={handleChange}
                placeholder="url-del-articulo"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-r-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Categoría</label>
              <input
                type="text"
                name="blogCategoryId"
                value={formData.blogCategoryId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, blogCategoryId: e.target.value }))
                }
                placeholder="Escribe la categoría (puede ser nueva)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Etiquetas</label>
              <input
                type="text"
                name="tags"
                value={(formData.tagIds || []).join(', ')}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tagIds: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="marketing, ecommerce, startups"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500">Separa las etiquetas con comas</p>
            </div>
          </div>

          {/* Related posts */}
          {/* <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">
              Artículos relacionados
            </label>
            <div className="relative">
              <input
                type="text"
                value={relatedQuery}
                onChange={(e) => setRelatedQuery(e.target.value)}
                placeholder="Buscar artículos para relacionar..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              {relatedSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-10">
                  {relatedSuggestions.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="text-gray-200">{post.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            relatedPosts: Array.from(
                              new Set([...(prev.relatedPosts || []), post.id!])
                            ),
                          }));
                          setRelatedQuery('');
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Añadir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.relatedPosts && formData.relatedPosts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.relatedPosts.map((id, index) => (
                  <span
                    key={id}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                  >
                    Artículo relacionado {index + 1}
                    <button
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          relatedPosts: prev.relatedPosts?.filter((postId) => postId !== id),
                        }));
                      }}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div> */}

          {/* Content (RichTextEditor) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">
              Contenido del artículo
            </label>
            <div className="md:flex md:gap-4">
              <div className="md:flex-1">
                <RichTextEditor
                  ref={rteRef}
                  value={contentHtml}
                  onChange={(html) => {
                    handleEditorChange(html);
                  }}
                  onKeyDown={() => {}}
                  onSubmit={() => {}}
                  autoFocus={false}
                  placeholder="Escribe el contenido del artículo..."
                  maxHeight="700px"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Cover Image */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Imagen de portada</label>
              <FileUpload
                onFile={(url) => setFormData((prev) => ({ ...prev, coverImageUrl: url }))}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/dashboard/blog')}
              className="px-6 py-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSubmit('DRAFT')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar borrador'}
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSubmit('PUBLISHED')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSaving ? 'Publicando...' : isEdit ? 'Actualizar' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
