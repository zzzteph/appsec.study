<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserLabLessonQuestionHintsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_lab_lesson_question_hints', function (Blueprint $table) {
            $table->id();
			$table->foreignId('lab_lesson_question_hint_id')->constrained()->onUpdate('cascade')->onDelete('cascade')->index('user_lab_hints_id');
			$table->foreignId('user_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_lab_lesson_question_hints');
    }
}
