module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { plano, email, nome, cpf, tipo_pagamento } = req.body;
  // tipo_pagamento: 'credit_card', 'pix', 'bolbradesco'
  // plano: 'mensal' ou 'anual'

  if (!plano || !email || !tipo_pagamento) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const valor = plano === 'anual' ? 109.00 : 9.90;
  const descricao = plano === 'anual'
    ? 'Ensinaprende+ Professor — Plano Anual'
    : 'Ensinaprende+ Professor — Plano Mensal';

  const body = {
    transaction_amount: valor,
    description: descricao,
    payment_method_id: tipo_pagamento,
    payer: {
      email,
      first_name: nome ? nome.split(' ')[0] : '',
      last_name: nome ? nome.split(' ').slice(1).join(' ') : '',
      identification: cpf ? { type: 'CPF', number: cpf.replace(/\D/g,'') } : undefined,
    },
    metadata: { plano, email, user_email: email },
    notification_url: `${process.env.NEXT_PUBLIC_URL || 'https://ensinaprende.com.br'}/api/webhook-pagamento`,
  };

  // Para cartão, token vem do frontend
  if (req.body.token) {
    body.token = req.body.token;
    body.installments = req.body.installments || 1;
    body.issuer_id = req.body.issuer_id;
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${email}-${plano}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP error:', JSON.stringify(data));
      return res.status(400).json({ error: data.message || 'Erro ao processar pagamento', details: data });
    }

    // PIX: retorna QR code
    if (tipo_pagamento === 'pix') {
      return res.status(200).json({
        id: data.id,
        status: data.status,
        pix_qr_code: data.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      });
    }

    // Boleto: retorna URL
    if (tipo_pagamento === 'bolbradesco' || tipo_pagamento === 'pec') {
      return res.status(200).json({
        id: data.id,
        status: data.status,
        boleto_url: data.transaction_details?.external_resource_url,
        boleto_barcode: data.barcode?.content,
      });
    }

    // Cartão: retorna status
    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
    });

  } catch (e) {
    console.error('Exception:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
