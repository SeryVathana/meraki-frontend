import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RootState } from "@/redux/store";
import { getToken } from "@/utils/HelperFunctions";
import { AlertTriangle, Ellipsis, Pen, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import SavePostDialog from "./dialogs/SavePostDialog";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";

const PostsContainer = ({ posts }: { posts: any[] }) => {
  const [sortedData, setSortedData] = useState([]);

  const handleRemovePosts = (postId: number) => {
    // const updatedPosts = data.filter((post) => post.id !== postId);
    const updatedPosts = sortedData.filter((post) => post.id !== postId);
    // setData(updatedPosts);
    setSortedData(updatedPosts);
  };

  useEffect(() => {
    // Calculate the number of columns based on window width
    const handleResize = () => {
      const width = window.innerWidth;
      let columns = 2; // Default to 2 columns
      if (width >= 1536) columns = 6; // 2xl
      else if (width >= 1280) columns = 5; // xl
      else if (width >= 1024) columns = 4; // lg
      else if (width >= 768) columns = 3; // md

      setSortedData(sortDataIntoColumns(posts, columns));
    };

    handleResize(); // Initial calculation
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [posts]);

  if (!posts) {
    return <h1>Loading</h1>;
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 mt-3">
      {sortedData.map((post, index) => (
        <div key={index} className="mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">
          <PostCard post={post} handleRemovePosts={handleRemovePosts} />
        </div>
      ))}
    </div>
  );
};

const sortDataIntoColumns = (data, columns) => {
  const sortedData = Array.from({ length: columns }, () => []);

  data.forEach((item, index) => {
    sortedData[index % columns].push(item);
  });

  // Flatten the sorted data
  return sortedData.flat();
};

const PostCard = ({ post, handleRemovePosts }) => {
  const auth = useSelector((state: RootState) => state.auth);
  const [report, setReport] = useState<string>("");
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmitReport = () => {
    if (report.trim().length == 0) {
      toast({
        title: "Report cannot be empty.",
        description: "Please provide a reason for reporting this post.",
        variant: "destructive",
      });
      return;
    }
    // handle report
    const reqBody = {
      user_id: auth.userData.id,
      post_id: post.id,
      reason: report,
    };

    fetch(`${import.meta.env.VITE_SERVER_URL}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(reqBody),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 200) {
          setIsReportOpen(false);
          setReport("");
          toast({
            title: "Reported successfully.",
            description: "Your report has been submitted. Post will be reviewed by our team.",
            variant: "success",
          });
        } else {
          toast({
            title: "Failed to report.",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      });

    // close dialog
  };

  const handleDeletePost = () => {
    fetch(`${import.meta.env.VITE_SERVER_URL}/post/${post.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 200) {
          handleRemovePosts(post.id);
          toast({
            title: "Post deleted successfully.",
            variant: "success",
          });
          setIsDeleteOpen(false);
        } else {
          toast({
            title: "Failed to delete post.",
            variant: "destructive",
          });
        }
      });
  };

  return (
    <div className="group relative border-[1px] rounded-2xl overflow-hidden cursor-pointer" key={post}>
      <SavePostDialog postId={post.id} isSaved={post.is_saved} type="icon" />

      <div className="hidden group-hover:flex absolute bottom-3 left-3 z-10 gap-2 items-center" onClick={() => navigate(`/user/${post.user_id}`)}>
        <Avatar className="w-6 h-6">
          <AvatarImage src={post.user_pf_img_url} alt="@shadcn" className="object-cover w-full h-full" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        <div className="flex flex-col text-white">
          <h1 className="font-medium text-xs line-clamp-1 truncate">{post.first_name + " " + post.last_name}</h1>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute w-8 h-5 bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 group-hover:bg-white"
          >
            <Ellipsis className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(auth.userData.id == post.user_id || auth.userData.role == "admin") && (
            <>
              <DropdownMenuItem asChild>
                <>
                  <Link to={`/post/edit/${post.id}`} className="w-full py-0 text-left cursor-pointer">
                    <div className="flex gap-2 justify-start items-center py-2 px-2 text-sm cursor-pointer hover:bg-gray-100 rounded-sm">
                      <Pen className="w-4 h-4" />
                      <span>Edit</span>
                    </div>
                  </Link>
                </>
              </DropdownMenuItem>
            </>
          )}

          {(auth.userData.id == post.user_id || auth.userData.role == "admin" || post.is_admin) && (
            <DropdownMenuItem asChild>
              <>
                <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(!isDeleteOpen)}>
                  <DialogTrigger asChild>
                    <div className="flex gap-2 justify-start items-center py-2 px-2 text-sm cursor-pointer hover:bg-gray-100 rounded-sm">
                      <Trash className="w-4 h-4" />
                      <span>Delete</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Delete Post</DialogTitle>
                    <DialogDescription>Are you sure you want to delete this post? This action cannot be undone.</DialogDescription>
                    <div className="flex gap-5 justify-end">
                      <Button variant="outline" onClick={() => setIsDeleteOpen(!isDeleteOpen)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeletePost()}>
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            </DropdownMenuItem>
          )}

          {auth.userData.id != post.user_id && (
            <DropdownMenuItem asChild>
              <>
                <Dialog open={isReportOpen} onOpenChange={() => setIsReportOpen(!isReportOpen)}>
                  <DialogTrigger asChild>
                    <div className="flex gap-2 justify-start items-center py-2 px-2 text-sm cursor-pointer hover:bg-gray-100 rounded-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Report</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Report Post</DialogTitle>
                    <DialogDescription>If you believe this post violates our community guidelines, please report it.</DialogDescription>
                    <div className="flex flex-col gap-5">
                      <Textarea
                        placeholder="Add reason here."
                        className="border-2 min-h-[150px]"
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                      />
                      <Button variant="default" className="w-full font-semibold" onClick={() => handleSubmitReport()}>
                        Report
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div onClick={() => navigate(`/post/${post.id}`)}>
        <img className="w-full bg-gray-100" src={post.img_url} alt="" />
        <div className="hidden group-hover:flex">
          <div className="absolute top-0 left-0 w-full h-full opacity-80 bg-gradient-to-t from-black to-[#80808050]" />
        </div>
      </div>
    </div>
  );
};

export default PostsContainer;
