import PG from 'pg';
import dotenv from 'dotenv';
import { logError } from './logger';

dotenv.config();

const client = new PG.Client({
  connectionString: process.env.PG_CONNECTION,
});

async function loadChainsAndVisits() {
  await client.connect();
  const visits = await loadVisits();
  const chains = await loadChains();
  await client.end();
  return {
    visits,
    chains,
  };
}

async function loadChains() {
  const updatedChains = [];
  try {
    const { rows: uniqueClients } = await client.query(
      `
      SELECT client.*, client.date - interval '30 days' as click_min_date, connect.event_date as connect_date FROM (
        SELECT user_id, service_id, MIN(event_date) as date
        FROM marketing.campaign_events
        WHERE event_type = 'payment'
        GROUP BY user_id, service_id
      ) client
      INNER JOIN marketing.campaign_events connect
        ON client.user_id = connect.user_id
        AND client.service_id = connect.service_id
        AND connect.event_date < client.date
        AND connect.event_type = 'connect'
    `,
      [],
    );

    for (const c of uniqueClients) {
      const {
        rows: [visit],
      } = await client.query(
        `
        SELECT visit.*
        FROM marketing.campaign_events visit
        WHERE
          event_type = 'click'
          AND event_date BETWEEN $1 AND $2
          AND track_id IN (
            SELECT track_id
            FROM marketing.campaign_events
            WHERE event_type = 'identify' AND track_id IS NOT NULL AND user_id = $3
            GROUP BY track_id
          )
        ORDER BY event_date DESC
        LIMIT 1
    `,
        [c.click_min_date, c.date, c.user_id],
      );

      if (visit) {
        const { rows: payments } = await client.query(
          `
          SELECT *
          FROM marketing.campaign_events
          WHERE service_id = $1 AND user_id = $2 AND event_type = 'payment'
          ORDER BY event_date ASC
        `,
          [c.service_id, c.user_id],
        );
        updatedChains.push({ visit, payments });
      }
    }
  } catch (error) {
    logError(error);
  }

  return updatedChains;
}

async function loadVisits() {
  const { rows } = await client.query(
    `
      SELECT
        MAX(visit.event_id) as event_id,
        MAX(visit.event_date) as event_date,
        MAX(visit.sub_track_id) as sub_track_id,
        MAX(visit.campaign_id) as campaign_id,
        MAX(visit.affiliate_id) as affiliate_id,
        MAX(identify.user_id) as user_id
      FROM marketing.campaign_events visit
      LEFT JOIN (
        SELECT identify.track_id, MAX(identify.user_id) as user_id, MAX(click.event_id) as click_event_id
        FROM marketing.campaign_events identify
        INNER JOIN marketing.campaign_events click ON click.track_id = identify.track_id
        WHERE identify.user_id <> '' AND identify.event_type = 'identify'
        GROUP BY identify.track_id
      ) identify ON
        identify.click_event_id = visit.event_id
      WHERE visit.event_type = 'click' AND campaign_id <> '' AND affiliate_id <> ''
      GROUP BY visit.track_id
  `,
    [],
  );
  return rows;
}

export default loadChainsAndVisits;
