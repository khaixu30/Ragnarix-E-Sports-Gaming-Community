// ─── Helpers ─────────────────────────────────────────────────────────────────
const isValidDate = (val) => val && !isNaN(Date.parse(val));

const fail = (res, message) =>
  res.status(400).json({ success: false, message });

// ─── Create Event ─────────────────────────────────────────────────────────────
export const validateCreateEvent = (req, res, next) => {
  const {
    council_id,
    game_id,
    title,
    event_type,
    team_size,
    registration_fee,
    prize_pool,
    start_time,
    end_time,
    registration_deadline,
  } = req.body;

  if (!council_id)  return fail(res, "council_id is required");
  if (!game_id)     return fail(res, "game_id is required");
  if (!title?.trim()) return fail(res, "title is required");

  if (!event_type || !["Solo", "Team"].includes(event_type))
    return fail(res, "event_type must be 'Solo' or 'Team'");

  if (event_type === "Team" && !team_size)
    return fail(res, "team_size is required for Team events");

  if (event_type === "Solo" && team_size != null)
    return fail(res, "team_size should not be set for Solo events");

  if (team_size != null && (!Number.isInteger(team_size) || team_size < 2))
    return fail(res, "team_size must be an integer >= 2");

  if (registration_fee != null && registration_fee < 0)
    return fail(res, "registration_fee must be >= 0");

  if (prize_pool != null && prize_pool < 0)
    return fail(res, "prize_pool must be >= 0");

  if (!isValidDate(start_time))        return fail(res, "start_time is required and must be a valid date");
  if (!isValidDate(end_time))          return fail(res, "end_time is required and must be a valid date");
  if (!isValidDate(registration_deadline)) return fail(res, "registration_deadline is required and must be a valid date");

  if (new Date(end_time) <= new Date(start_time))
    return fail(res, "end_time must be after start_time");

  if (new Date(registration_deadline) >= new Date(start_time))
    return fail(res, "registration_deadline must be before start_time");

  next();
};

// ─── Update Event ─────────────────────────────────────────────────────────────
export const validateUpdateEvent = (req, res, next) => {
  const {
    title,
    event_type,
    team_size,
    registration_fee,
    prize_pool,
    start_time,
    end_time,
    registration_deadline,
  } = req.body;

  if (title !== undefined && !title?.trim())
    return fail(res, "title cannot be empty");

  if (event_type !== undefined && !["Solo", "Team"].includes(event_type))
    return fail(res, "event_type must be 'Solo' or 'Team'");

  if (team_size !== undefined && team_size != null && (!Number.isInteger(team_size) || team_size < 2))
    return fail(res, "team_size must be an integer >= 2");

  if (registration_fee !== undefined && registration_fee < 0)
    return fail(res, "registration_fee must be >= 0");

  if (prize_pool !== undefined && prize_pool < 0)
    return fail(res, "prize_pool must be >= 0");

  if (start_time !== undefined && !isValidDate(start_time))
    return fail(res, "start_time must be a valid date");

  if (end_time !== undefined && !isValidDate(end_time))
    return fail(res, "end_time must be a valid date");

  if (registration_deadline !== undefined && !isValidDate(registration_deadline))
    return fail(res, "registration_deadline must be a valid date");

  // Cross-field date checks — only when both sides are present in the payload
  const resolvedStart = start_time ?? req.event?.start_time;
  const resolvedEnd   = end_time   ?? req.event?.end_time;

  if (resolvedEnd && resolvedStart && new Date(resolvedEnd) <= new Date(resolvedStart))
    return fail(res, "end_time must be after start_time");

  if (registration_deadline && resolvedStart && new Date(registration_deadline) >= new Date(resolvedStart))
    return fail(res, "registration_deadline must be before start_time");

  next();
};

// ─── Status Update ────────────────────────────────────────────────────────────
export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;

  if (!status || !["Live", "Completed", "Cancelled"].includes(status))
    return fail(res, "status must be 'Live', 'Completed', or 'Cancelled'");

  next();
};