const neo4j = require('neo4j-driver');
const { driver, config, executeQuery } = require('./src/config/database');

async function checkDatabase() {
  try {
    await executeQuery(driver, async (session) => {
      // Check appointments
      const appointmentsResult = await session.run('MATCH (a:Appointment) RETURN count(a) as count');
      console.log('Total appointments:', appointmentsResult.records[0].get('count').toNumber());

      // Check leads
      const leadsResult = await session.run('MATCH (l:Lead) RETURN count(l) as count');
      console.log('Total leads:', leadsResult.records[0].get('count').toNumber());

      // Check salesmen
      const salesmenResult = await session.run('MATCH (s:Salesman) RETURN count(s) as count');
      console.log('Total salesmen:', salesmenResult.records[0].get('count').toNumber());
    });
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await driver.close();
  }
}

checkDatabase(); 