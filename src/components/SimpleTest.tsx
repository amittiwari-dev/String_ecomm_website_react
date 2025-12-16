import { getLatestReleases, books } from '@/data/mockData';

const SimpleTest = () => {
  const latestBooks = getLatestReleases();
  
  console.log('SimpleTest component rendered');
  console.log('Total books:', books.length);
  console.log('Latest releases:', latestBooks.length);
  console.log('First latest book:', latestBooks[0]);

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">Simple Test Component</h1>
      <div className="space-y-2">
        <p>Total books in mock data: {books.length}</p>
        <p>Latest releases: {latestBooks.length}</p>
        <p>Component is rendering properly!</p>
      </div>
      
      {latestBooks.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">First Latest Book:</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Title:</strong> {latestBooks[0].title}</p>
            <p><strong>Author:</strong> {latestBooks[0].authors[0]?.name}</p>
            <p><strong>Price:</strong> ₹{latestBooks[0].price}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTest;