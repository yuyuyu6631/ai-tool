import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminToolEditor from "../AdminToolEditor";

const mockSaveAdminTool = vi.fn();

vi.mock("../../../lib/catalog-api", () => ({
  fetchAdminTool: vi.fn(),
  saveAdminTool: (payload: object, toolId?: number) => mockSaveAdminTool(payload, toolId),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("AdminToolEditor", () => {
  beforeEach(() => {
    mockSaveAdminTool.mockReset();
    mockSaveAdminTool.mockResolvedValue({ id: 12 });
  });

  it("submits structured product element and media fields", async () => {
    render(<AdminToolEditor />);

    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "new-tool" } });
    fireEvent.change(screen.getByLabelText("工具名称"), { target: { value: "New Tool" } });
    fireEvent.change(screen.getByLabelText("分类 Slug"), { target: { value: "office" } });
    fireEvent.change(screen.getByLabelText("分类名称"), { target: { value: "Office" } });
    fireEvent.change(screen.getByLabelText("官网链接"), { target: { value: "https://example.com" } });
    fireEvent.change(screen.getByLabelText("一句话介绍"), { target: { value: "A useful AI tool." } });
    fireEvent.change(screen.getByLabelText("特点"), { target: { value: "上手快\n模板多" } });
    fireEvent.change(screen.getByLabelText("缺陷"), { target: { value: "高级能力需要付费" } });
    fireEvent.change(screen.getByLabelText("适合人群"), { target: { value: "学生\n运营" } });
    fireEvent.change(screen.getByLabelText("优惠说明"), { target: { value: "免费版适合轻量使用。" } });
    fireEvent.change(screen.getByLabelText("媒体类型"), { target: { value: "video" } });
    fireEvent.change(screen.getByLabelText("媒体地址"), { target: { value: "https://example.com/demo.mp4" } });
    fireEvent.change(screen.getByLabelText("媒体标题"), { target: { value: "演示视频" } });

    fireEvent.submit(screen.getByRole("button", { name: "保存工具" }).closest("form")!);

    await waitFor(() => {
      expect(mockSaveAdminTool).toHaveBeenCalled();
    });
    expect(mockSaveAdminTool.mock.calls[0][0]).toMatchObject({
      slug: "new-tool",
      features: ["上手快", "模板多"],
      limitations: ["高级能力需要付费"],
      bestFor: ["学生", "运营"],
      dealSummary: "免费版适合轻量使用。",
      mediaItems: [{ type: "video", url: "https://example.com/demo.mp4", title: "演示视频" }],
    });
  });

  it("renders demo maintenance sections with clear Chinese labels", () => {
    render(<AdminToolEditor />);

    expect(screen.getByText("基础信息")).toBeInTheDocument();
    expect(screen.getByText("展示信息")).toBeInTheDocument();
    expect(screen.getByText("价格与可用性")).toBeInTheDocument();
    expect(screen.getByText("评测信息")).toBeInTheDocument();
    expect(screen.getByText("媒体信息")).toBeInTheDocument();
  });
});
