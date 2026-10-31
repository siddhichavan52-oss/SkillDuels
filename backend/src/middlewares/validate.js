// Input sanitization and validation helpers

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = {};

  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';

  if (cleanName.length < 2) {
    errors.name = 'Enter your name (at least 2 characters).';
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    errors.email = 'Enter a valid email address, like name@college.edu.';
  }
  if (
    cleanPassword.length < 6 ||
    !/[a-zA-Z]/.test(cleanPassword) ||
    !/\d/.test(cleanPassword)
  ) {
    errors.password = 'Use at least 6 characters with a letter and a number.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  req.body.name = cleanName;
  req.body.email = cleanEmail;
  req.body.password = cleanPassword;
  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = {};

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';

  if (!cleanEmail) {
    errors.email = 'Enter your email address.';
  }
  if (!cleanPassword) {
    errors.password = 'Enter your password.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  req.body.email = cleanEmail;
  req.body.password = cleanPassword;
  next();
}

export function validateCategory(req, res, next) {
  const { name, description } = req.body || {};
  const errors = {};

  const cleanName = (name || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanName.length < 2 || cleanName.length > 30) {
    errors.name = 'Enter a name between 2 and 30 characters.';
  }
  if (cleanDesc.length < 10) {
    errors.description = 'Describe the category in at least 10 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  req.body.name = cleanName;
  req.body.description = cleanDesc;
  next();
}

export function validateQuestion(req, res, next) {
  const { categoryId, text, options, answer } = req.body || {};
  const errors = {};

  if (!categoryId) {
    errors.categoryId = 'Choose a category.';
  }
  if (!text || text.trim().length < 10) {
    errors.text = 'Write the question in at least 10 characters.';
  }

  if (!Array.isArray(options) || options.length !== 4) {
    errors.options = 'Provide exactly 4 options.';
  } else {
    const trimmed = options.map((o) => (o || '').trim());
    trimmed.forEach((o, i) => {
      if (!o) errors[`option${i}`] = 'Fill in this answer.';
    });
    if (new Set(trimmed.map((o) => o.toLowerCase())).size < 4) {
      errors.options = 'Each answer must be different.';
    }
  }

  const ansNum = Number(answer);
  if (isNaN(ansNum) || ansNum < 0 || ansNum > 3) {
    errors.answer = 'Mark the correct answer (0, 1, 2, or 3).';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  req.body.text = text.trim();
  req.body.options = options.map((o) => o.trim());
  req.body.answer = ansNum;
  next();
}
