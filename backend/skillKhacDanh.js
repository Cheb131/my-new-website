
const skillKhacDanh = [
  { name: "Gian Hùng", desc: "Sau khi bạn nhận sát thương, bạn có thể rút một lá bài, rồi thu lấy lá bài gây ra sát thương này." },
  { name: "Khôi Thác", desc:"Sau khi bạn nhận sát thương, bạn có thể lệnh một người chơi tiến hành phát xét, nếu kết quả là: - Màu Đỏ, họ hồi phục 1 điểm sinh lực; - Màu Đen, họ rút X lá bài (X là số sát thương)." },
  { name: "Phóng Trục", desc:"Sau khi bạn nhận sát thương, bạn có thể lệnh một người chơi khác đặt chồng võ tướng, sau đó người đó rút X lá bài (X là số sinh lực bạn đã mất)." },
  { name: "Tiềm Long", desc:"Sau khi bạn nhận sát thương, bạn có thể mở ra 3 lá đầu chồng bài rút rồi thu lấy trong đó tối đa X lá bài (X là số sinh lực bạn đã mất), sau đó đặt phần còn dư xuống đáy chồng bài rút." },
  { name: "Xưng Tượng", desc:"Sau khi bạn nhận sát thương, bạn có thể mở ra 4 lá đầu chồng bài rút, sau đó thu lấy tùy ý trong đó số lá bài có tổng điểm số ≤ 13. Nếu bài thu được này có tổng điểm số là 13, thì bạn phục hồi bài võ tướng về trạng thái ban đầu." },
  { name: "Vũ Diễm", desc:"Giai đoạn hành động hoặc sau khi bạn nhận sát thương, bạn có thể lựa chọn một người chơi giới tính nam, lệnh họ có thể sử dụng một lá bài trên tay đối với một người chơi khác còn lại do bạn lựa chọn, nếu họ: - Sử dụng bài, bạn rút hai lá bài; - Không sử dụng bài hoặc không gây ra sát thương, bạn có thể lệnh họ mất một điểm sinh lực, kỹ năng này vô hiệu trong giai đoạn hiện tại." },
  { name: "Tửu Thi", desc:"Mỗi khi bạn cần sử dụng [Tửu], nếu mặt trước bài võ tướng của bạn đang hướng lên trên, bạn có thể đặc chồng võ tướng của bạn, xem như sử dụng một lá [Tửu]; nếu bạn vì nhận sát thương mà tiêu hao sinh lực khi mặt sau bài võ tướng của bạn đang hướng lên trên, sau khi kết toán sát thương này, bạn có thể lật mặt sau sang mặt trước. Cứ sau mỗi lần bạn sử dụng [Tửu], số lần sử dụng [Sát] của bạn +1 cho đến khi kết thúc lượt của bạn." },
  { name: "Ngung Khấp", desc:"Sau khi có người nhận sát thương, nếu cự ly giữa bạn và họ ≤ 0, bạn có thể quan sát 3 lá bài đầu chồng bài, đem tối đa 1 lá trong đó giao cho người bị thương, tối đa 1 lá tự mình thu lấy, bài còn dư đặt lại đầu chồng bài rút (mỗi lượt chơi giới hạn 2 lần)." },
  { name: "Quy Tâm", desc:"Sau khi bạn nhận 1 sát thương, bạn có thể thu lấy ngẫu nhiên trong vùng chơi mỗi người chơi khác 1 lá bài, nếu bạn thu được số bài nhiều hơn 4 đồng thời võ tướng của bạn đang mở mặt, bạn đặt chồng." },
];

module.exports = skillKhacDanh;