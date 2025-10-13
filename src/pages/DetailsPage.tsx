import { useParams } from "react-router-dom";

const DetailsPage = () => {
  const { id } = useParams(); // ✅ get the `id` from the URL

  return (
    <div>
      <h1>Details Page</h1>
      <p>Route ID: {id}</p>
    </div>
  );
};

export default DetailsPage;
