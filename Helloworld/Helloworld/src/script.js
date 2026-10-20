const foodDate = [
	{
		id:1,
		name:"四川麻辣火锅",
		category:"川菜",
		image:"images/hotpot.jpg",
		description:"四川传统火锅，麻辣鲜香，回味无穷",
		ingredients:["牛肉","羊肉","豆腐","蔬菜","火锅底料"],
		steps:["准备食材","煮开火锅底料","涮煮食材","蘸料享用"],
		rating:4.8
	},
];

document.addEventListener('DOMContentLoaded',function () {
	const path = window.location.pathname;
	const page = path.split("/").pop();
	
	if (page==="index.html"||page==="") {
		loadHomePage();
	}else if (page==="categories.html") {
		loadCategoriesPage();
	}else if (page.startsWith("detail-")) {
		const id = parseInt(page.replace("detail-","").replace(".html",""));
		loadDetailPage(id);
	}
});

function loadHomePage() {
	const name = document.querySelector('main');
	main.innerHTML=
		<section class = "banner" >
			<h1>发现美食的奇妙世界</h1>
			<p>探索来自世界各地的美味佳肴</p>
		</section>
		<section class = "featured">
			<h2>本周热门推荐</h2>
			<div class = "food-grid">
				${generateFoodCards(foodDate.slice(0,3))}
			</div>
		</search>
	;
}

function generateFoodCards(foods) {
	return foods.map(food=>
		<div class="food-card">
			<img src="${food.image}"alt="${food.name}"class="food-image">
			<div class="food-info">
				<h3 class="food-title">${food.name}</h3>
				<p class="food-desc">${food.description}</p>
				<p class="food-category">分类:${food.category}</p>
				<p class="food-rating">评分:${food.rating}/5</p>
				<a herf="detail-${food.id}.html"=class="read-more">查看详情</a>
			</div>
		</div>
	).join(");
}

function loadDetailPage(id) {
	const foos = foodDate.find(item=>item.id===id);
	if(!food){
		document.querySelector('main')..innerHTML = 
			<article class="food-detail">
				<h1>${food.name}</h1>
				<div class="detail-container">
					<div>
						<img       src="${food.image}"        alt="${food.name}"        class="detail-image">
						<p>${food.description}</p>
					</div>
					<div>
						<h3>食材清单</h3>
						<ul class="ingredients-list">
							${food.ingredients.map(ing=><li>${ing}</li>).join(")}
						</ul>
						<h3>制作步骤</h3>
						<ol class="steps-list">
							${food.steps.map(step=><li>${step}</li>).join(")}
						</ol>
					</div>
				</div>
				<div class="rating-form">
					<h3>评价这道美食</h3>
					<form id="ratingForm">
						<div>
							<label for="rating">评分:</label>
							<select id="rating"name="rating">
								<option value="5">5星-完美</option>
								<option value="4">4星-很好</option>
								<option value="3">3星-一般</option>
								<option value="2">2星-较差</option>
								<option value="1">1星-很差</option>
							</select>
						</div>
						<div>
							<label for="comment">评论:</label>
							<textarea        id="comment"        name="comment"        rows="4"></textarea>
						</div>
						<button type="submit">提交评价</button>
					</form>
				</div>
			</article>
		;
		
		document.getElementById('ratingForm').addEventListener('submit', function (e) {
			e.preventDefault();
			alert('感谢你的评价！');
			this.reset();
		});
	}
}