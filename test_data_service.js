
const { dataService } = require('./src/utils/dataService');

async function test() {
  console.log('Fetching requests...');
  const requests = await dataService.getAllRequests();
  if (requests.length > 0) {
    console.log('Sample Request:', JSON.stringify(requests[0], null, 2));
  } else {
    console.log('No requests found.');
  }
}

test();
