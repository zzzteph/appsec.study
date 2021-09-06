@include('include.header')


    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="{{route('courses')}}">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
		  </ul>
	</nav>
    </div>
	</section>
	
	
	 <section class="section">
		 <div class="container">

		 <div class="box is-shadowless">
		<h1 class="title">{{$lesson->lab->name}}
 @if($lesson->status=='done')
  <span class="icon has-text-success">
    <i class="fas fa-check"></i>
  </span>
@endif
</h1>

{!! $lesson->lab->content !!}
</div>

<div class="box is-shadowless">
	@if(is_null($task))
	

	
<div class="block">
<form method="POST" action="{{route('start-task',['lesson_id' => $lesson->id])}}">

	@csrf
		<div class="field">
  <div class="control">
    <button class="button is-success">
	<span class="icon-text">
  <span class="icon">
  <i class="fas fa-play"></i>
  </span>
  <span>Start</span>
</span>
	
	
	
	
	
	</button>
  </div>
</div>
	</form>	
</div>		

		@elseif(!is_null($task) && ($task->lab_lesson_id==$lesson->lab->id) &&  ($task->status=='todo'||$task->status=='starting'||$task->status=='tostop'||$task->status=='stopping'))
	 <div  id="app" class="block">
			  
			  
		<progress class="progress is-small is-warning" v-if="vm.status=='todo'"  :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
		<progress class="progress is-small is-success" v-if="vm.status=='starting'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
		<progress class="progress is-small is-warning" v-if="vm.status=='tostop'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
		<progress class="progress is-small is-danger" v-if="vm.status=='stopping'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  

	
	</div>
	
	
	@elseif(!is_null($task) && ($task->lab_lesson_id==$lesson->lab->id) &&  ($task->status=='running'))
	 <div class="block" id="app">

	@if($lesson->lab->vm->type=='code')
		
<div class="content"><a href="http://{{$task->ip}}:8081" class="button is-success is-fullwidth" target="_blank"> Edit code </a></div>
@endif
<div class="content">
	<p><a href="http://{{$task->ip}}" class="button is-success is-fullwidth" target="_blank"> Open Lab</a></p>
	<p class="content is-small">{{$task->ip}}</p>
	</div>
	</div>
<div class="block">
		<form method="POST" action="{{route('stop-task',['lesson_id' => $lesson->id])}}">
		@method('DELETE')
	@csrf
		<div class="field">
  <div class="control">
    <button class="button is-danger is-small">
	<span class="icon-text icon-text is-align-items-center">
  <span class="icon">
  <i class="fas fa-stop-circle"></i>
  </span>
  <span>Stop</span>
</span>
	
		
	</button>
  </div>
</div>
	</form>	
	</div>
	
	
	
	
	@else
	 <div class="block">	
	<form method="POST" action="{{route('start-task',['lesson_id' => $lesson->id])}}">
	@csrf
		<div class="field">
  <div class="control">
    <button class="button is-success" disabled>
	<span class="icon-text">
  <span class="icon">
  <i class="fas fa-play"></i>
  </span>
  <span>Start</span>
</span>
	
	
	
	
	
	</button>
  </div>
</div>
	</form>	
	
	</div>
	@endif
</div>
	    </div>
	</section>
	
			 <section class="section">
		 <div class="container">
		 
		 <div class="icon-text is-size-5  is-align-items-center">
  <span class="icon has-text-info is-large">
    <i class="fas fa-question-circle fas fa-lg"></i>
  </span>
  <span>{{$lesson->lab->correct_questions}} of {{$lesson->lab->questions_count}}</span>
</div>
		 
		 
				</div>


@foreach ($lesson->lab->questions as $question)
  


		 <div class="container">
			 
			 <div class="content box">
			 @if( $question->correct) 
			
			 
				 <p>{!! $question->question !!}</p>
				 <p><strong>{{$question->answer}}</strong></p>
		
			@else
		<form method="POST" action="{{route('question-answer',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
			@csrf
			<input type="hidden" name="question_id" value="{{$question->id}}">
			 <div class="field">
			  <div class="control">
				 {!! $question->question !!}
				 </div><br/>
				  <div class="control">
					<input class="input" type="text" name="answer" placeholder="Text input">
				  </div>
				</div>
				 
				<div class="field">
				  <div class="control">
					<button class="button is-success">
					<span class="icon-text">
				  <span class="icon">
					<i class="fas fa-thumbs-up"></i>
				  </span>
				  <span>Answer</span>
				</span>

					</button>
				  </div>
				</div>
		</form>

		</div>
		@break
			
@endif

 


 
 
 
			
		</div>	
	
@endforeach

	


    </section>
	
	
	@if(!is_null($task) && ($task->lab_lesson_id==$lesson->lab->id) &&  ($task->status=='todo' || $task->status=='starting' || $task->status=='tostop' || $task->status=='stopping'))
	
	
	
	<script>

new Vue({
    el: "#app",
    data: {
        vm: null,
        interval: null,

    },


    methods: {

        getVM: function(event) {
            axios.get('/api/v1/task').then((response) => {
                this.vm = response.data;
				if(this.vm.status=='running' || this.vm.status=='terminated') 
				{
					document.location.reload(true);
				}
            }).catch(error => {
			if(error.response && error.response.status === 404) {
     document.location.reload(true);
    }
			
			});

        },
		
    },
    mounted: function() {
	this.getVM();
    var self = this;
    this.interval=setInterval(function() {			self.getVM();    }, 2000);
    }

});
</script>
	@endif
	
@include('include.footer')