'use client';

import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Search, Send, MessageCircle, Mail, Globe, User, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// 🔹 Query GraphQL
const GET_ENTREPRENEURS = gql`
  query GetEntrepreneurs {
    entrepreneurs {
      id
      name
      email
      phone
      companyName
      city
      country
      category
      referralSource
      website
      description
      identification
      createdAt
    }
  }
`;

// 🔹 Tipos TypeScript
interface Entrepreneur {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  city?: string;
  country?: string;
  category?: string;
  referralSource?: string;
  website?: string;
  description?: string;
}

// 🔹 Componente principal
const WhatsappCampaignPage = () => {
  const { data, loading, error } = useQuery(GET_ENTREPRENEURS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const entrepreneurs: Entrepreneur[] = data?.entrepreneurs || [];

  // 🔸 Filtrado por nombre o email
  const filteredEntrepreneurs = useMemo(() => {
    return entrepreneurs.filter(
      (e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, entrepreneurs]);

  // 🔸 Selección individual o múltiple
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEntrepreneurs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntrepreneurs.map((e) => e.id));
    }
  };

  // 🔸 Envío de campaña de WhatsApp
  const handleSendCampaign = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un emprendedor.');
      return;
    }

    try {
      const phoneNumbers = selectedIds.map((id) => {
        const ent = entrepreneurs.find((e) => e.id === id);
        return ent && ent?.phone?.startsWith('+') ? ent.phone : `+57${ent?.phone}`;
      });

      const payload = {
        phoneNumbers,
        templateName: 'creacion_tienda',
        languageCode: 'es_CO',
        parameters: [
          {
            type: 'text',
            parameter_name: 'name',
            text: 'emprendedor',
          },
        ],
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        toast.error(`Error al enviar la campaña: ${errorData.message || response.statusText}`);
        return;
      }

      const data = await response.json();
      toast.success(
        `✅ Campaña enviada correctamente a ${data.sentCount || selectedIds.length} emprendedor(es).`
      );
    } catch (error) {
      console.error('Error general al enviar la campaña:', error);
      toast.error('Hubo un error al enviar la campaña. Revisa la consola.');
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando emprendedores...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">Error: {error.message}</div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campañas de WhatsApp
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona emprendedores para enviar mensajes personalizados
            </p>
          </div>
          <button
            onClick={handleSendCampaign}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            Enviar campaña
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredEntrepreneurs.length &&
                      filteredEntrepreneurs.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="accent-green-600 h-4 w-4"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Emprendedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Website
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEntrepreneurs.map((e) => (
                <tr
                  key={e.id}
                  className={`transition-colors ${
                    selectedIds.includes(e.id)
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      className="accent-green-600 h-4 w-4"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {e.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {e.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {e.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      {e.phone || 'No registrado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {e.companyName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {e.city || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {e.website ? (
                      <a
                        href={e.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <Globe className="w-4 h-4" />
                        Ver sitio
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No disponible</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                    <div className="line-clamp-2" title={e.description}>
                      {e.description || 'Sin descripción'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEntrepreneurs.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron emprendedores.
            </div>
          )}
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4">
          {/* Select All for Mobile */}
          {filteredEntrepreneurs.length > 0 && (
            <div className="flex items-center gap-3 px-2 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={
                  selectedIds.length === filteredEntrepreneurs.length &&
                  filteredEntrepreneurs.length > 0
                }
                onChange={toggleSelectAll}
                className="accent-green-600 h-5 w-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionar todos ({filteredEntrepreneurs.length})
              </span>
            </div>
          )}

          {filteredEntrepreneurs.map((e) => (
            <div
              key={e.id}
              onClick={() => toggleSelect(e.id)}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                selectedIds.includes(e.id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {e.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{e.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{e.companyName}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(e.id)}
                  onChange={() => toggleSelect(e.id)}
                  className="accent-green-600 h-5 w-5 mt-1"
                  onClick={(ev) => ev.stopPropagation()}
                />
              </div>

              <div className="space-y-2.5 pl-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{e.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{e.phone || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{e.city || 'N/A'}</span>
                </div>
                {e.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={e.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      {e.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {e.description && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {e.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredEntrepreneurs.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron emprendedores.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsappCampaignPage;
