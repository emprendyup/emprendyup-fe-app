'use client';

import React, { useState } from 'react';
import { Search, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, gql } from '@apollo/client';

const GET_SENT_WHATSAPP_MESSAGES = gql`
  query GetSentWhatsAppMessages($phoneNumber: String) {
    getSentWhatsAppMessages(phoneNumber: $phoneNumber) {
      id
      whatsappId
      type
      direction
      text
      status
      timestamp
      delivered
      read
      errorCode
      errorMessage
      contact {
        id
        phoneNumber
        name
        profileName
        language
      }
      conversation {
        id
        status
        lastMessageAt
        contact {
          id
          phoneNumber
          name
          profileName
        }
      }
      createdAt
      updatedAt
    }
  }
`;

interface WhatsAppMessage {
  id: string;
  whatsappId: string;
  type: string;
  direction: string;
  text: string;
  status: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
  errorCode?: string;
  errorMessage?: string;
  contact: {
    id: string;
    phoneNumber: string;
    name?: string;
    profileName?: string;
    language?: string;
  };
  conversation: {
    id: string;
    status: string;
    lastMessageAt: string;
    contact: {
      id: string;
      phoneNumber: string;
      name?: string;
      profileName?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const WhatsAppMessages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneNumberFilter] = useState('');

  const { loading, error, data } = useQuery(GET_SENT_WHATSAPP_MESSAGES, {
    variables: { phoneNumber: phoneNumberFilter || undefined },
  });

  const messages: WhatsAppMessage[] = data?.getSentWhatsAppMessages || [];
  const totalCount = messages.length;

  const filteredMessages = messages.filter(
    (message) =>
      message.contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.contact.phoneNumber.includes(searchTerm) ||
      message.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (message: WhatsAppMessage) => {
    if (message.errorCode) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (message.read) {
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    if (message.delivered) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (message: WhatsAppMessage) => {
    if (message.errorCode) {
      return `Error: ${message.errorMessage || message.errorCode}`;
    }
    if (message.read) {
      return 'Leído';
    }
    if (message.delivered) {
      return 'Entregado';
    }
    return 'Enviado';
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
            <h1 className="text-3xl font-bold text-white mb-1">Mensajes de WhatsApp Enviados</h1>
            <p className="text-slate-400">
              {loading ? 'Cargando...' : `${totalCount} mensajes enviados`}
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
            Error al cargar mensajes: {error.message}
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
              <div className="animate-pulse">Cargando mensajes...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/80 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Mensaje
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Enviado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(message.contact.name || message.contact.phoneNumber)}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {message.contact.name || message.contact.profileName || 'Sin nombre'}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Phone className="w-3 h-3" />
                            {message.contact.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300 max-w-md">{message.text}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(message)}
                        <span className="text-sm text-slate-300">{getStatusText(message)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-400">{formatTime(message.timestamp)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredMessages.length === 0 && (
            <div className="p-12 text-center text-slate-400">No se encontraron mensajes</div>
          )}
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-pulse">Cargando mensajes...</div>
            </div>
          ) : (
            <>
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(message.contact.name || message.contact.phoneNumber)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        {message.contact.name || message.contact.profileName || 'Sin nombre'}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Phone className="w-3 h-3" />
                        {message.contact.phoneNumber}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-sm text-slate-300">{message.text}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(message)}
                        <span className="text-slate-300">{getStatusText(message)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && filteredMessages.length === 0 && (
                <div className="p-12 text-center text-slate-400">No se encontraron mensajes</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessages;
