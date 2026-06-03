const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { payment_id, email, plano } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'payment_id obrigatório' });

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await mpRes.json();

    // Se aprovado e webhook ainda não processou, ativa manualmente
    if (payment.status === 'approved' && email && plano) {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      const { data: perfil } = await supabase
        .from('perfis')
        .select('plano')
        .eq('email', email)
        .single();

      if (perfil && perfil.plano !== 'professor') {
        const expira = new Date();
        if (plano === 'anual') expira.setFullYear(expira.getFullYear() + 1);
        else expira.setMonth(expira.getMonth() + 1);

        await supabase.from('perfis').update({
          plano: 'professor',
          plano_ativo_ate: expira.toISOString(),
        }).eq('email', email);
      }
    }

    return res.status(200).json({
      status: payment.status,
      status_detail: payment.status_detail,
      approved: payment.status === 'approved',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
