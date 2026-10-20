const foodData = [
	{
		id: 1,
		name: "四川麻辣火锅",
		category: "川菜",
		image: "images/hotpot.svg",
		description: "四川传统火锅，麻辣鲜香，回味无穷",
		ingredients: ["牛肉", "羊肉", "豆腐", "蔬菜", "火锅底料"],
		steps: ["准备食材", "煮开火锅底料", "涮煮食材", "蘸料享用"],
		rating: 4.8
	},
	{
		id: 2,
		name: "广式虾饺皇",
		category: "粤菜",
		image: "images/dimsum.svg",
		description: "皮薄馅足，晶莹剔透，一口咬下满是鲜虾",
		ingredients: ["鲜虾", "澄面", "生粉", "竹笋", "猪油"],
		steps: ["处理鲜虾", "调制馅料", "擀制水晶皮", "上锅蒸8分钟"],
		rating: 4.7
	},
	{
		id: 3,
		name: "日式三文鱼寿司",
		category: "日本料理",
		image: "images/sushi.svg",
		description: "米饭微酸回甘，三文鱼入口即化",
		ingredients: ["三文鱼", "寿司米", "寿司醋", "芥末", "酱油"],
		steps: ["煮制寿司米", "拌入寿司醋", "握制饭团", "铺上鱼片"],
		rating: 4.6
	},
	{
		id: 4,
		name: "意式提拉米苏",
		category: "甜点",
		image: "images/tiramisu.svg",
		description: "咖啡与马斯卡彭的经典组合，入口绵密",
		ingredients: ["马斯卡彭", "手指饼干", "浓缩咖啡", "鸡蛋", "可可粉"],
		steps: ["打发蛋黄", "混合马斯卡彭", "浸泡饼干", "冷藏4小时"],
		rating: 4.9
	}
];

document.addEventListener('DOMContentLoaded', function () {
	const path = window.location.pathname;
	const page = path.split("/").pop();

	if (page === "index.html" || page === "") {
		loadHomePage();
	} else if (page === "categories.html") {
		loadCategoriesPage();
	} else if (page === "featured.html") {
		loadFeaturedPage();
	} else if (page.startsWith("detail-")) {
		const id = parseInt(page.replace("detail-", "").replace(".html", ""));
		loadDetailPage(id);
	}
});

function loadHomePage() {
	const main = document.querySelector('main');
	main.innerHTML = `
		<section class="banner">
			<h1>发现美食的奇妙世界</h1>
			<p>探索来自世界各地的美味佳肴</p>
		</section>
		<section class="featured">
			<h2>本周热门推荐</h2>
			<div class="food-grid">
				${generateFoodCards(foodData.slice(0, 3))}
			</div>
		</section>
	`;
}

function loadFeaturedPage() {
	const main = document.querySelector('main');
	const featured = [...foodData].sort((a, b) => b.rating - a.rating);

	main.innerHTML = `
		<h1 class="page-title">本周推荐</h1>
		<div class="food-grid">
			${generateFoodCards(featured)}
		</div>
	`;
}

function loadCategoriesPage() {
	const main = document.querySelector('main');
	const categories = [...new Set(foodData.map(food => food.category))];

	main.innerHTML = `
		<h1 class="page-title">美食分类</h1>
		${categories.map(category => `
			<section class="category-section">
				<h2>${category}</h2>
				<div class="food-grid">
					${generateFoodCards(foodData.filter(food => food.category === category))}
				</div>
			</section>
		`).join("")}
	`;
}

function generateFoodCards(foods) {
	return foods.map(food => `
		<div class="food-card">
			<img src="${food.image}" alt="${food.name}" class="food-image">
			<div class="food-info">
				<h3 class="food-title">${food.name}</h3>
				<p class="food-desc">${food.description}</p>
				<p class="food-category">分类: ${food.category}</p>
				<p class="food-rating">评分: ${food.rating}/5</p>
				<a href="detail-${food.id}.html" class="read-more">查看详情</a>
			</div>
		</div>
	`).join("");
}

function loadDetailPage(id) {
	const food = foodData.find(item => item.id === id);

	if (!food) {
		document.querySelector('main').innerHTML = `
			<article class="food-detail">
				<h1>没有找到这道美食</h1>
				<p><a href="index.html" class="read-more">返回首页</a></p>
			</article>
		`;
		return;
	}

	document.querySelector('main').innerHTML = `
		<article class="food-detail">
			<h1>${food.name}</h1>
			<div class="detail-container">
				<div>
					<img src="${food.image}" alt="${food.name}" class="detail-image">
					<p>${food.description}</p>
				</div>
				<div>
					<h3>食材清单</h3>
					<ul class="ingredients-list">
						${food.ingredients.map(ing => `<li>${ing}</li>`).join("")}
					</ul>
					<h3>制作步骤</h3>
					<ol class="steps-list">
						${food.steps.map(step => `<li>${step}</li>`).join("")}
					</ol>
				</div>
			</div>
			<div class="rating-form">
				<h3>评价这道美食</h3>
				<form id="ratingForm">
					<div>
						<label for="rating">评分:</label>
						<select id="rating" name="rating">
							<option value="5">5星-完美</option>
							<option value="4">4星-很好</option>
							<option value="3">3星-一般</option>
							<option value="2">2星-较差</option>
							<option value="1">1星-很差</option>
						</select>
					</div>
					<div>
						<label for="comment">评论:</label>
						<textarea id="comment" name="comment" rows="4"></textarea>
					</div>
					<button type="submit">提交评价</button>
				</form>
			</div>
		</article>
	`;

	document.getElementById('ratingForm').addEventListener('submit', function (e) {
		e.preventDefault();
		alert('感谢你的评价！');
		this.reset();
	});
}
