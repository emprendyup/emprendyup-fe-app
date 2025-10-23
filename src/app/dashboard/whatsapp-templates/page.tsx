'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, ArrowUpDown, MessageSquare, Edit2, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';

const GET_TEMPLATES = gql`
  query {
    getWhatsAppTemplates {
      id
      templateName
      category
      language
      status
      message
    }
  }
`;

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate(
    $templateName: String!
    $category: String!
    $language: String!
    $status: String!
    $message: String!
  ) {
    createWhatsAppTemplate(
      templateName: $templateName
      category: $category
      language: $language
      status: $status
      message: $message
    ) {
      id
      templateName
      category
      language
      status
      message
    }
  }
`;

const UPDATE_WHATSAPP_TEMPLATE = gql`
  mutation UpdateWhatsAppTemplate($id: String!, $data: UpdateWhatsAppTemplateInput!) {
    updateWhatsAppTemplate(id: $id, data: $data) {
      id
      templateName
      category
      language
      status
      message
    }
  }
`;

const DELETE_WHATSAPP_TEMPLATE = gql`
  mutation DeleteWhatsAppTemplate($id: String!) {
    deleteWhatsAppTemplate(id: $id) {
      id
      templateName
    }
  }
`;

const WhatsAppTemplatesPage = () => {
  const { data, loading, error, refetch } = useQuery(GET_TEMPLATES);
  const [createTemplate] = useMutation(CREATE_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_WHATSAPP_TEMPLATE);
  const [deleteTemplate] = useMutation(DELETE_WHATSAPP_TEMPLATE);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    templateName: '',
    category: 'Marketing',
    language: 'Spanish',
    status: 'Active',
    message: 'Hola {{name}}, este es un mensaje de prueba.',
  });

  const templates = data?.getWhatsAppTemplates || [];

  const filteredTemplates = useMemo(() => {
    return templates.filter((template: any) => {
      const matchesSearch =
        template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm, templates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      templateName: '',
      category: 'Marketing',
      language: 'Spanish',
      status: 'Active',
      message: 'Hola {{name}}, este es un mensaje de prueba.',
    });
    setShowModal(true);
  };

  const openEditModal = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName,
      category: template.category,
      language: template.language,
      status: template.status,
      message: template.message,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Seguro que deseas eliminar la plantilla "${name}"?`)) {
      deleteTemplate({ variables: { id } })
        .then(() => {
          refetch();
          // Si tienes react-hot-toast instalado, puedes usar:
          toast.success(`Plantilla "${name}" eliminada correctamente`);
          console.log(`Plantilla "${name}" eliminada correctamente`);
        })
        .catch((err) => {
          console.error('Error al eliminar:', err);
          toast.error('Error al eliminar la plantilla');
          alert('Error al eliminar la plantilla');
        });
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTemplate) {
        await updateTemplate({
          variables: {
            id: editingTemplate.id,
            data: formData,
          },
        });
      } else {
        await createTemplate({ variables: formData });
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const getPreview = (message: string) => {
    if (message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    return message;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Plantillas de WhatsApp</h1>
            <p className="text-slate-400">
              {loading ? 'Cargando...' : `${templates.length} plantillas disponibles`}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-emerald-500/30 font-medium"
          >
            <Plus className="w-4 h-4" />
            Crear plantilla
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
            Error al cargar plantillas: {error.message}
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-600/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-700/50 text-white placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="hidden md:block bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-pulse">Cargando plantillas...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/80 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      Plantilla
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredTemplates.map((template: any) => (
                  <tr key={template.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">
                          {template.templateName}
                        </div>
                        <div className="text-xs text-blue-400 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Ver detalles
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-xs text-slate-400 italic mb-1">
                          {getPreview(template.message)}
                        </div>
                        <div className="text-xs text-slate-500">{template.language}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{template.category}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id, template.templateName)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className="p-12 text-center text-slate-400">No se encontraron plantillas</div>
          )}
        </div>

        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-pulse">Cargando plantillas...</div>
            </div>
          ) : (
            <>
              {filteredTemplates.map((template: any) => (
                <div
                  key={template.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{template.templateName}</h3>
                      <div className="text-xs text-blue-400 flex items-center gap-1 mb-2">
                        <MessageSquare className="w-3 h-3" />
                        Ver detalles
                      </div>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 ml-2">
                      {template.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Categoría:</span>
                      <span className="text-white">{template.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Idioma:</span>
                      <span className="text-white">{template.language}</span>
                    </div>
                  </div>

                  <div className="mb-4 pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 italic">{template.message}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(template)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.templateName)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {!loading && filteredTemplates.length === 0 && (
                <div className="p-12 text-center text-slate-400">No se encontraron plantillas</div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-6">
              {editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  placeholder="Ej: bienvenida_cliente"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  className="w-full border border-slate-600 bg-slate-700/50 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-600 bg-slate-700/50 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Utility">Utilidad</option>
                    <option value="Authentication">Autenticación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Idioma</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full border border-slate-600 bg-slate-700/50 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="Spanish">Español</option>
                    <option value="Spanish (COL)">Español (COL)</option>
                    <option value="English (US)">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-600 bg-slate-700/50 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="Active">Activo</option>
                    <option value="Pending">Pendiente</option>
                    <option value="Rejected">Rechazado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mensaje</label>
                <textarea
                  placeholder="Escribe tu mensaje aquí. Usa {{variable}} para variables dinámicas."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border border-slate-600 bg-slate-700/50 text-white px-4 py-3 rounded-lg h-32 focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Tip: Usa variables como {`{{name}}`}, {`{{1}}`}, {`{{2}}`} para personalizar
                  mensajes
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/30"
                >
                  {editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplatesPage;
