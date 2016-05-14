
var gulp = require('gulp')

var gutil = require('gulp-util')
var uglify = require('gulp-uglify')									//用于压缩js
var minifycss = require("gulp-clean-css")							//压缩css
var htmlmin = require('gulp-htmlmin')								//压缩html

var less = require('gulp-less')										//编译less
var sass = require('gulp-ruby-sass')								//编译sass

var spritesmith = require('gulp.spritesmith')						//合成雪碧图

var autoprefixer = require('gulp-autoprefixer')						//Autoprefixer解析CSS文件并且添加浏览器前缀到CSS规则里，使用Can I Use的数据来决定哪些前缀是需要的。
var combiner = require('stream-combiner2')
var sourcemaps = require('gulp-sourcemaps')
var rename = require('gulp-rename')									//文件更名
var concat = require('gulp-concat')									//文件合并
var clean = require('gulp-clean')									//删除文件夹及文件
var runSequence = require('gulp-sequence')							//gulp按顺序执行任务

var tinypng = require("gulp-tinypng");								//压缩图片
var tinypng_api_key = "lpetoRr6T2mVgHS7FH_Jlojeua_fRVs0";			//需要去TINYPNG注册获取apikey


var handleError = function (err) {
	var colors = gutil.colors;
	console.log('\n')
	gutil.log(colors.red('Error!'))
	gutil.log('fileName: ' + colors.red(err.fileName))
	gutil.log('lineNumber: ' + colors.red(err.lineNumber))
	gutil.log('message: ' + err.message)
	gutil.log('plugin: ' + colors.yellow(err.plugin))
}

// 压缩html
gulp.task('html_compress', function() {
	return gulp.src('src/templates/*.html')
			.pipe(htmlmin({collapseWhitespace: true}))
			.pipe(gulp.dest('dist/templates/'))
});

//压缩js 并重新命名
gulp.task('js_compress', function () {
	var combined = combiner.obj([
		gulp.src('src/js/**/*.js'),
		sourcemaps.init(),
		rename({ suffix: '.min' }),
		uglify(),
		sourcemaps.write('./'),
		gulp.dest('dist/js/')
	])
	combined.on('error', handleError)
})

//合并js文件
gulp.task('js_merge', function() {
	var combined = combiner.obj([
		gulp.src('src/js/**/*.js'),
		concat('all.js'),
		gulp.dest('dist/js/')
	])
	combined.on('error', handleError)
});

//压缩、合并CSS
gulp.task('css_compress',function(){
	return gulp.src('src/css/**/*.css')
			.pipe(sourcemaps.init())
			.pipe(autoprefixer({
				browsers: 'last 2 versions'
			}))			
			.pipe(concat("main.all.css"))
			.pipe(minifycss({
				"advanced ":true,
				"compatibility": "ie7"
			}))
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest('dist/css/'))

});


//编译less
var lessTask = function(){
	var combined = combiner.obj([
		gulp.src('src/less/**/*.less'),
		sourcemaps.init(),
		autoprefixer({
			browsers: 'last 2 versions'
		}),
		less(),
		minifycss({
			"advanced ":true,
			"compatibility": "ie7"
		}),
		sourcemaps.write('./'),
		gulp.dest('dist/css/')
	])
	combined.on('error', handleError)
};
gulp.task('lesscss', function(){
	return lessTask();
});

//编译sass
gulp.task('sasscss', function () {
	sass('src/sass/')
		.on('error', function (err) {
			console.error('Error!', err.message);
		})
		.pipe(sourcemaps.init())
		.pipe(minifycss({
			"advanced ":true,
			"compatibility": "ie7"
		}))
		.pipe(autoprefixer({
			browsers: 'last 2 versions'
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('dist/css'))
})


//图片压缩
//开发时不自动压缩 , 请开手动挡
gulp.task("image_compress",function(){
	return gulp.src('src/images/**/*.{jpg,png,jpeg,JPG,JPEG,PNG}')
			//.pipe(changed(build_dest))
			.pipe(tinypng(tinypng_api_key))
			.pipe(gulp.dest('dist/images'))

})

//生成雪碧图
gulp.task('sprite', function () {
	var spriteData = gulp.src('src/images/*.png').pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: 'sprite.css',
		padding: 2,//合并时两个图片的间距
		algorithm: 'binary-tree'
	}))
	return spriteData.pipe(gulp.dest('dist/css/'));
})

//直接复制文件到dist
gulp.task('copy', function () {
	return gulp.src('src/fonts/**/*')
			.pipe(gulp.dest('dist/fonts/'))
})

//构建时，先删除dist
gulp.task("clean",function(){
	return gulp.src('dist')
		.pipe(clean({read: false}));
})

//监听 运行 gulp watch
gulp.task("watch",function(){
	gulp.watch('src/less/**/*', function(e){
		if(e.type != "error"){
			console.log("less watcher");
			lessTask();
		} else {
			console.log("error");
		}
	});
	gulp.watch('src/css/**/*', ["css_compress"]);
	gulp.watch('src/templates/**/*', ["html_compress"]);
	gulp.watch('src/js/**/*', ["js_compress"]);
	gulp.watch('src/images/*.png', ["sprite"]);
});

//打包构建
gulp.task('build', function(cb) {
	//顺序执行
	//1、先清理dist目录
	//2、拷贝文件
	//3、压缩js
	//4、压缩合并css
	//5、压缩html
	//6、压缩图片
	//runSequence("clean", "copy", "js_compress", "css_compress", "html_compress", "image_compress")(cb)
	runSequence("clean", "copy", "js_compress", "css_compress", "html_compress")(cb)
})