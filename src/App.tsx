import React, { useState, useEffect } from 'react';
import { productCategories } from './data/products';
import { formatCPF, formatPhone, formatCurrency } from './utils/formatters';
import { DocumentModal } from './components/DocumentModal';
import { OrderItem } from './types';

// Add Google Script Run type definition for TypeScript
declare global {
  interface Window {
    google?: {
      script?: {
        run: {
          withSuccessHandler: (handler: (response: any) => void) => any;
          withFailureHandler: (handler: (error: any) => void) => any;
          processarDocumento: (data: any) => void;
        };
      };
    };
  }
}

export default function App() {
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [evento, setEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [localEvento, setLocalEvento] = useState('');
  
  const [gasUrl, setGasUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', productName: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'orcamento' | 'contrato';
    status: 'loading' | 'success' | 'error';
    step: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    errorMsg?: string;
  }>({
    isOpen: false,
    type: 'orcamento',
    status: 'loading',
    step: 1
  });

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfCliente(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), productName: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("É necessário ter pelo menos um item no orçamento.");
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-update price when product is selected
        if (field === 'productName') {
          // Find product to get price
          let price = 0;
          for (const category of Object.values(productCategories)) {
            const prod = category.find(p => p.name === value);
            if (prod) {
              price = prod.price;
              break;
            }
          }
          updatedItem.unitPrice = price;
        }

        // Recalculate total
        updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateGrandTotal = () => {
    return items.reduce((acc, item) => acc + item.total, 0);
  };

  const validateForm = () => {
    if (!nomeCliente || !cpfCliente || !evento || !localEvento || !dataEvento || !formaPagamento || !telefone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }
    for (const item of items) {
      if (!item.productName || item.quantity <= 0 || item.unitPrice < 0) {
        alert('Por favor, preencha todos os itens corretamente.');
        return false;
      }
    }
    return true;
  };

  const updateStepDelay = (stepNum: number, delayMs: number) => {
    setTimeout(() => {
      setModalState(prev => ({ ...prev, step: stepNum }));
    }, delayMs);
  };

  const generateDocument = async (tipo: 'orcamento' | 'contrato') => {
    if (!validateForm()) return;

    const total = formatCurrency(calculateGrandTotal());
    
    const data = {
      nomeCliente,
      cpfCliente,
      evento,
      localEvento,
      dataEvento,
      formaPagamento,
      telefone,
      itens: items.map(item => ({
        produto: item.productName,
        quantidade: item.quantity,
        valorUnitario: item.unitPrice,
        totalItem: item.total
      })),
      total,
      tipoDocumento: tipo
    };

    setModalState({ isOpen: true, type: tipo, status: 'loading', step: 1 });
    
    // Simulate initial steps visually
    updateStepDelay(2, 500);
    updateStepDelay(3, 1500);
    updateStepDelay(4, 2500);

    // 1. Check if running inside Google Apps Script (HTML Service)
    if (window.google?.script?.run) {
      window.google.script.run
        .withSuccessHandler((response: any) => {
          updateStepDelay(5, 500);
          setTimeout(() => {
            setModalState({
              isOpen: true,
              type: tipo,
              status: 'success',
              step: 5,
              fileName: response.fileName,
              fileSize: response.fileSize ? (response.fileSize / 1024).toFixed(2) + ' KB' : 'N/A',
              fileUrl: response.fileUrlOrcamento || response.fileUrlContrato
            });
          }, 1000);
        })
        .withFailureHandler((error: any) => {
          setModalState({
            isOpen: true,
            type: tipo,
            status: 'error',
            step: 5,
            errorMsg: typeof error === 'string' ? error : error.message
          });
        })
        .processarDocumento(data);
      return;
    }

    // 2. Fallback to POST fetch if a GAS Web App URL is provided
    if (gasUrl) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors', // Apps script web apps often require no-cors if not returning proper headers
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        // Because of no-cors, we can't read the response. We just assume success if it didn't throw.
        updateStepDelay(5, 500);
        setTimeout(() => {
          setModalState({
            isOpen: true,
            type: tipo,
            status: 'success',
            step: 5,
            fileName: `${tipo === 'orcamento' ? 'Orçamento' : 'Contrato'}_${nomeCliente}.pdf`,
            fileSize: 'N/A (CORS)',
            fileUrl: '#' // URL is inaccessible with no-cors, tell user to check Drive
          });
        }, 1000);
      } catch (error: any) {
        setModalState({
          isOpen: true,
          type: tipo,
          status: 'error',
          step: 5,
          errorMsg: error.message
        });
      }
      return;
    }

    // 3. Fallback for AI Studio preview: Just simulate success
    setTimeout(() => {
      updateStepDelay(5, 500);
      setTimeout(() => {
        setModalState({
          isOpen: true,
          type: tipo,
          status: 'success',
          step: 5,
          fileName: `[SIMULAÇÃO] ${tipo === 'orcamento' ? 'Orçamento' : 'Contrato'}.pdf`,
          fileSize: '124.50 KB',
          fileUrl: '#'
        });
      }, 1000);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5E5E5] to-[#F5F5DC] font-serif flex flex-col">
      <header className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white text-center py-8 shadow-md">
        <h1 className="text-3xl tracking-widest font-bold mb-2">Regina Ribas</h1>
        <p className="text-sm tracking-widest opacity-90">DOCES FINOS</p>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto my-8 bg-white p-6 md:p-10 rounded-xl shadow-xl">
        <div className="flex justify-between items-center border-b-2 border-[#D4AF37] pb-2 mb-6">
          <h2 className="text-2xl text-[#8B4513] text-center w-full">Gerador de Orçamentos e Contratos</h2>
        </div>

        {/* Configuration toggle (For testing outside of GAS) */}
        {!window.google?.script?.run && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p className="mb-2"><strong>Modo Preview:</strong> Este aplicativo não está rodando dentro do Google Apps Script.</p>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-[#8B4513] underline font-bold">
              {isSettingsOpen ? 'Ocultar Configuração' : 'Configurar URL do Web App (Opcional)'}
            </button>
            {isSettingsOpen && (
              <div className="mt-3">
                <input 
                  type="text" 
                  value={gasUrl} 
                  onChange={(e) => setGasUrl(e.target.value)} 
                  placeholder="https://script.google.com/macros/s/SEU_ID/exec"
                  className="w-full p-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <p className="text-xs mt-1">Se não preenchido, a geração do PDF será apenas simulada visualmente.</p>
              </div>
            )}
          </div>
        )}

        <form className="space-y-8" onSubmit={e => e.preventDefault()}>
          
          {/* Dados do Cliente */}
          <section className="bg-[#FAF9F6] p-6 rounded-lg border-l-4 border-[#D4AF37]">
            <h3 className="text-lg text-[#8B4513] mb-4 font-bold">📋 Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">Nome do Cliente *</label>
                <input type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="Nome completo" required />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">CPF do Cliente *</label>
                <input type="text" value={cpfCliente} onChange={handleCpfChange} maxLength={14} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="000.000.000-00" required />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">Telefone *</label>
                <input type="tel" value={telefone} onChange={handlePhoneChange} maxLength={15} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="(00) 00000-0000" required />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">Forma de Pagamento *</label>
                <input type="text" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="Ex: PIX, Depósito" required />
              </div>
            </div>
          </section>

          {/* Dados do Evento */}
          <section className="bg-[#FAF9F6] p-6 rounded-lg border-l-4 border-[#D4AF37]">
            <h3 className="text-lg text-[#8B4513] mb-4 font-bold">🎉 Dados do Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">Tipo de Evento *</label>
                <input type="text" value={evento} onChange={e => setEvento(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="Ex: Casamento, Aniversário" required />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">Data do Evento *</label>
                <input type="date" value={dataEvento} onChange={e => setDataEvento(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" required />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1 text-[#2F4F4F] text-sm">Local do Evento *</label>
                <input type="text" value={localEvento} onChange={e => setLocalEvento(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="Endereço completo" required />
              </div>
            </div>
          </section>

          {/* Itens do Orçamento */}
          <section className="bg-[#FAF9F6] p-6 rounded-lg border-l-4 border-[#D4AF37]">
            <h3 className="text-lg text-[#8B4513] mb-4 font-bold">🍰 Itens do Orçamento</h3>
            
            <div className="overflow-x-auto mb-4">
              <table className="w-full bg-white rounded-lg overflow-hidden border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#8B4513] text-white p-3 text-left w-2/5">Produto</th>
                    <th className="bg-[#8B4513] text-white p-3 text-center w-1/5">Qtd.</th>
                    <th className="bg-[#8B4513] text-white p-3 text-center w-1/5">Valor Unit.</th>
                    <th className="bg-[#8B4513] text-white p-3 text-right w-1/5">Total</th>
                    <th className="bg-[#8B4513] text-white p-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="p-2 border-x border-gray-200">
                        <select 
                          value={item.productName}
                          onChange={e => handleItemChange(item.id, 'productName', e.target.value)}
                          className="w-full p-2 border-2 border-gray-200 rounded focus:outline-none focus:border-[#D4AF37]"
                          required
                        >
                          <option value="" disabled>Selecione um produto...</option>
                          {Object.entries(productCategories).map(([category, prods]) => (
                            <optgroup key={category} label={category}>
                              {prods.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-x border-gray-200">
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity || ''}
                          onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border-2 border-gray-200 rounded text-center focus:outline-none focus:border-[#D4AF37]"
                          required
                        />
                      </td>
                      <td className="p-2 border-x border-gray-200 bg-gray-50">
                        <input 
                          type="text" 
                          value={item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}
                          readOnly
                          className="w-full p-2 bg-transparent text-center focus:outline-none"
                        />
                      </td>
                      <td className="p-2 border-x border-gray-200 bg-gray-50">
                        <input 
                          type="text" 
                          value={item.total ? item.total.toFixed(2) : '0.00'}
                          readOnly
                          className="w-full p-2 bg-transparent text-right font-bold focus:outline-none text-[#2F4F4F]"
                        />
                      </td>
                      <td className="p-2 border-x border-gray-200 text-center">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="bg-gradient-to-br from-[#CD5C5C] to-[#DC143C] text-white px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleAddItem}
              className="mb-4 text-[#8B4513] font-bold py-2 px-4 rounded border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-colors"
            >
              + Adicionar Item
            </button>

            <div className="bg-[#F5F5DC] border-2 border-[#D4AF37] rounded-lg p-4 text-right text-2xl font-bold text-[#8B4513]">
              Total: {formatCurrency(calculateGrandTotal())}
            </div>
          </section>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button 
              onClick={() => generateDocument('orcamento')}
              className="bg-gradient-to-br from-[#D4AF37] to-[#F4C430] text-[#2F4F4F] px-8 py-3 rounded-lg font-bold shadow-lg hover:translate-y-[-2px] hover:shadow-xl transition-all"
            >
              📄 Gerar Orçamento
            </button>
            <button 
              onClick={() => generateDocument('contrato')}
              className="bg-gradient-to-br from-[#D4AF37] to-[#F4C430] text-[#2F4F4F] px-8 py-3 rounded-lg font-bold shadow-lg hover:translate-y-[-2px] hover:shadow-xl transition-all"
            >
              📋 Gerar Contrato
            </button>
          </div>

        </form>
      </main>

      <footer className="text-center py-8 text-gray-600 text-sm">
        <p className="font-bold">Regina Ribas Doces Finos</p>
        <p>Rua Madre Mary Marceline 175, Itaipu, Niterói - RJ</p>
        <p>Contato: (21) 96648-6222</p>
      </footer>

      <DocumentModal 
        {...modalState} 
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))} 
        onRetry={() => generateDocument(modalState.type)}
      />
    </div>
  );
}
