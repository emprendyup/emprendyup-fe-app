'use client';

import React, { useState } from 'react';
import { Search, MessageCircle, Phone, Clock, Filter, Send } from 'lucide-react';
import { useQuery, gql } from '@apollo/client';

const GET_WHATSAPP_MESSAGES = gql`
  query GetAllWhatsAppMessages {
    getAllWhatsAppMessages {
      id
      templateName
      to
      messageId
      timestamp
    }
  }
`;

interface Conversation {
  phoneNumber: string;
  contactName: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
}

const WhatsAppConversations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());

  const { loading, error, data } = useQuery(GET_WHATSAPP_MESSAGES);

  const conversations = data?.whatsappConversations?.conversations || [];
  const totalCount = data?.whatsappConversations?.count || 0;

  const filteredConversations = conversations.filter(
    (conv: any) =>
      conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.phoneNumber.includes(searchTerm) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleConversation = (phoneNumber: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(phoneNumber)) {
      newSelected.delete(phoneNumber);
    } else {
      newSelected.add(phoneNumber);
    }
    setSelectedConversations(newSelected);
  };

  const toggleAll = () => {
    if (selectedConversations.size === filteredConversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(filteredConversations.map((c: any) => c.phoneNumber)));
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Conversaciones de WhatsApp</h1>
            <p className="text-slate-400">
              {loading ? 'Cargando...' : `${totalCount} conversaciones activas`}
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
            Error al cargar conversaciones: {error.message}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o mensaje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-600/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-700/50 text-white placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-pulse">Cargando conversaciones...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/80 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Último mensaje
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Mensajes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Última actividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredConversations.map((conversation: any) => (
                  <tr
                    key={conversation.phoneNumber}
                    className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(conversation.contactName)}
                        </div>
                        <div className="font-medium text-white">{conversation.contactName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {conversation.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-400 max-w-md truncate">
                        {conversation.lastMessage}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{conversation.messageCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {formatTime(conversation.lastMessageTime)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredConversations.length === 0 && (
            <div className="p-12 text-center text-slate-400">No se encontraron conversaciones</div>
          )}
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-pulse">Cargando conversaciones...</div>
            </div>
          ) : (
            <>
              {filteredConversations.map((conversation: any) => (
                <div
                  key={conversation.phoneNumber}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(conversation.contactName)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{conversation.contactName}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Phone className="w-3 h-3" />
                        {conversation.phoneNumber}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-sm text-slate-300 italic">{conversation.lastMessage}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{conversation.messageCount}</span>
                        <span>mensajes</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        {formatTime(conversation.lastMessageTime)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && filteredConversations.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  No se encontraron conversaciones
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConversations;
