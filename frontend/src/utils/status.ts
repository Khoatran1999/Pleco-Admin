export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "processing":
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-50 text-slate-700";
  }
};

export default getStatusColor;

export const getStatusDotColor = (status: string) => {
  switch (status) {
    case "In Stock":
    case "in_stock":
      return "bg-emerald-500";
    case "Low Stock":
    case "low_stock":
      return "bg-orange-500";
    case "Out of Stock":
    case "out_of_stock":
      return "bg-red-500";
    default:
      return "bg-slate-300";
  }
};

export const getStatusTextColor = (status: string) => {
  switch (status) {
    case "In Stock":
    case "in_stock":
      return "text-emerald-500";
    case "Low Stock":
    case "low_stock":
      return "text-orange-500";
    case "Out of Stock":
    case "out_of_stock":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
};
