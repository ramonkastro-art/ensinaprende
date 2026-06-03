const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { type, data } = req.body;

    // Só processa notificações de pagamento
    if (type !== 'payment') return res.status(200).json({ ok: true });

    const paymentId = data?.id;
    if (!paymentId) return res.status(200).json({ ok: true });

    // Busca detalhes do pagamento no MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await mpRes.json();

    if (payment.status !== 'approved') {
      return res.status(200).json({ ok: true, status: payment.status });
    }

    // Pagamento aprovado — ativa plano no Supabase
    const email = payment.metadata?.user_email || payment.payer?.email;
    const plano = payment.metadata?.plano || 'mensal';

    if (!email) return res.status(200).json({ ok: true });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Calcula data de expiração
    const agora = new Date();
    const expira = new Date(agora);
    if (plano === 'anual') {
      expira.setFullYear(expira.getFullYear() + 1);
    } else {
      expira.setMonth(expira.getMonth() + 1);
    }

    // Atualiza perfil do usuário
    const { error } = await supabase
      .from('perfis')
      .update({
        plano: 'professor',
        plano_ativo_ate: expira.toISOString(),
      })
      .eq('email', email);

    if (error) console.error('Supabase update error:', error);

    // Registra pagamento
    await supabase.from('pagamentos').insert([{
      payment_id: String(paymentId),
      email,
      plano,
      valor: payment.transaction_amount,
      status: payment.status,
      metodo: payment.payment_method_id,
      criado_em: new Date().toISOString(),
    }]).select();

    console.log(`✅ Plano ${plano} ativado para ${email} até ${expira.toISOString()}`);
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('Webhook error:', e.message);
    return res.status(200).json({ ok: true }); // sempre 200 para o MP não retentar
  }
};
