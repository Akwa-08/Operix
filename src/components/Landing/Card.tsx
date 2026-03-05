import {Card} from "@mui/material";

type CardContent = {
  image: string;
  title: string;
  description: string;
};

const CardPage: React.FC<CardContent> = ({image, title, description}) => {
  return (
    <Card className="rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white h-full flex flex-col border-2 border-transparent hover:border-violet-300">
      <div className="h-56 overflow-hidden relative group">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6 grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
    </Card>
  );
};

export default CardPage;
