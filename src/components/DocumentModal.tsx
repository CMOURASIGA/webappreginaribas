import React from 'react';

interface DocumentModalProps {
  isOpen: boolean;
  type: 'orcamento' | 'contrato';
  status: 'loading' | 'success' | 'error';
  step: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  errorMsg?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  type,
  status,
  step,
  fileUrl,
  fileName,
  fileSize,
  errorMsg,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  const typeName = type === 'orcamento' ? 'Orçamento' : 'Contrato';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden font-[Georgia]">
        
        {/* Header */}
        <div className="bg-[#8B4513] text-white p-4 text-center">
          <h3 className="text-xl font-bold">
            {status === 'loading' && `Gerando ${typeName}...`}
            {status === 'success' && `${typeName} Gerado com Sucesso! ✅`}
            {status === 'error' && `Erro ao Gerar Documento ❌`}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#f3f3f3] border-t-[#D4AF37] rounded-full animate-spin mb-6"></div>
              <div className="w-full flex flex-col gap-2">
                <StepItem currentStep={step} stepNum={1} text="Validando dados..." />
                <StepItem currentStep={step} stepNum={2} text="Criando documento..." />
                <StepItem currentStep={step} stepNum={3} text="Gerando PDF..." />
                <StepItem currentStep={step} stepNum={4} text="Salvando no Google Drive..." />
                <StepItem currentStep={step} stepNum={5} text="Finalizando..." />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col text-[#2F4F4F]">
              <p className="mb-2"><strong>📄 Arquivo:</strong> {fileName || `${typeName}.pdf`}</p>
              <p className="mb-2"><strong>📦 Tamanho:</strong> {fileSize || 'N/A'}</p>
              <p className="mb-4"><strong>✅ Status:</strong> Salvo no Google Drive</p>
              
              {fileUrl && (
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#8B4513] text-white py-3 px-6 rounded-lg font-bold text-center hover:bg-[#A0522D] transition-colors"
                >
                  🔗 Abrir PDF no Drive
                </a>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col text-[#2F4F4F]">
              <p className="mb-2 font-bold">Detalhes do erro:</p>
              <div className="bg-red-50 p-4 rounded-lg font-mono text-sm break-words border border-red-200 text-red-700 mb-4">
                {errorMsg || 'Erro desconhecido. Verifique sua conexão e tente novamente.'}
              </div>
              <div className="text-sm">
                <strong>Possíveis soluções:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Verifique se você configurou a URL do Google Apps Script corretamente</li>
                  <li>Confirme se o ID da pasta do Drive no GAS está correto</li>
                  <li>Tente novamente em alguns instantes</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(status === 'success' || status === 'error') && (
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
            {status === 'error' && onRetry && (
              <button 
                onClick={onRetry}
                className="px-4 py-2 bg-[#8B4513] text-white rounded-lg font-bold hover:bg-[#A0522D] transition-colors"
              >
                Tentar Novamente
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StepItem = ({ currentStep, stepNum, text }: { currentStep: number, stepNum: number, text: string }) => {
  const isCompleted = currentStep > stepNum;
  const isActive = currentStep === stepNum;
  
  let bgColor = 'bg-gray-50';
  let border = 'border-transparent';
  let icon = '⏳';
  
  if (isCompleted) {
    bgColor = 'bg-green-50';
    border = 'border-l-[3px] border-green-500';
    icon = '✅';
  } else if (isActive) {
    bgColor = 'bg-[#FFF8DC]';
    border = 'border-l-[3px] border-[#D4AF37]';
  }
  
  return (
    <div className={`flex items-center gap-3 p-2 rounded-md text-sm transition-all ${bgColor} ${border}`}>
      <span className="w-5 flex justify-center">{icon}</span>
      <span className={isActive ? 'font-bold' : ''}>{text}</span>
    </div>
  );
};
